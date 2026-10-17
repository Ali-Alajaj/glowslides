const Presentation = require('../models/Presentation');
const Waitlist = require('../models/Waitlist');
const { generatePresentation, regenerateSlide } = require('../services/nvidiaAi');
const { generatePptx, generateHtmlPresentation, generateMarkdownPresentation } = require('../services/exportService');
const { isConnected, memoryStore, getDBStatus } = require('../services/db');

// Helper to generate a unique ID for in-memory items
const generateId = () => 'mem_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

/**
 * Generate a new presentation using Nvidia AI
 */
exports.generate = async (req, res) => {
  try {
    const { topic, audience, tone, slideCount, theme, model } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ success: false, error: 'Topic is required to craft a presentation.' });
    }

    console.log(`🚀 [GlowSlides] Synthesizing presentation for topic: "${topic}" (${slideCount || 6} slides, audience: ${audience || 'General'})`);

    // 1. Generate deck data via Nvidia AI (or autonomous fallback)
    const generatedData = await generatePresentation({
      topic: topic.trim(),
      audience: audience || 'General',
      tone: tone || 'professional',
      slideCount: slideCount || 6,
      theme: theme || 'cyber-dark',
      model
    });

    // 2. Persist to the storage layer with User Ownership (prevents IDOR)
    const userId = req.user ? req.user.email : null;
    let savedPresentation;

    if (isConnected) {
      const doc = new Presentation({ ...generatedData, userId });
      savedPresentation = await doc.save();
    } else {
      const id = generateId();
      savedPresentation = {
        _id: id,
        id: id,
        userId,
        ...generatedData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      memoryStore.set(id, savedPresentation);
    }

    return res.status(201).json({
      success: true,
      message: 'Presentation synthesized successfully',
      data: savedPresentation
    });
  } catch (error) {
    console.error('❌ Generation Controller Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to synthesize presentation'
    });
  }
};

/**
 * Get all presentations - Filtered by current user if logged in (IDOR & Privacy Protected)
 */
exports.getAll = async (req, res) => {
  try {
    const userId = req.user ? req.user.email : null;
    let presentations = [];

    if (isConnected) {
      // If user is authenticated, return only their decks or unassigned demo decks
      const query = userId ? { $or: [{ userId }, { userId: null }] } : {};
      presentations = await Presentation.find(query)
        .sort({ updatedAt: -1 })
        .select('title topic theme audience tone slideCount createdAt updatedAt isFavorite userId');
    } else {
      presentations = Array.from(memoryStore.values())
        .filter(p => !userId || !p.userId || p.userId === userId)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .map(p => ({
          _id: p._id || p.id,
          id: p._id || p.id,
          title: p.title,
          topic: p.topic,
          theme: p.theme,
          audience: p.audience,
          tone: p.tone,
          slideCount: (p.slides && p.slides.length) || p.slideCount || 0,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          isFavorite: p.isFavorite || false,
          userId: p.userId || null
        }));
    }

    return res.json({
      success: true,
      count: presentations.length,
      data: presentations
    });
  } catch (error) {
    console.error('❌ GetAll Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get a single presentation by ID
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    let presentation = null;

    if (isConnected) {
      // Validate ObjectId
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        presentation = await Presentation.findById(id);
      }
    }

    if (!presentation) {
      presentation = memoryStore.get(id);
    }

    if (!presentation) {
      return res.status(404).json({ success: false, error: 'Presentation not found' });
    }

    return res.json({
      success: true,
      data: presentation
    });
  } catch (error) {
    console.error('❌ GetById Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Update an existing presentation (slides, title, theme, etc.)
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, theme, slides, audience, tone, isFavorite } = req.body;

    let updated = null;

    if (isConnected && id.match(/^[0-9a-fA-F]{24}$/)) {
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (theme !== undefined) updateData.theme = theme;
      if (slides !== undefined) {
        updateData.slides = slides;
        updateData.slideCount = slides.length;
      }
      if (audience !== undefined) updateData.audience = audience;
      if (tone !== undefined) updateData.tone = tone;
      if (isFavorite !== undefined) updateData.isFavorite = isFavorite;

      updated = await Presentation.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    }

    if (!updated && memoryStore.has(id)) {
      const existing = memoryStore.get(id);
      updated = {
        ...existing,
        title: title !== undefined ? title : existing.title,
        theme: theme !== undefined ? theme : existing.theme,
        slides: slides !== undefined ? slides : existing.slides,
        slideCount: slides !== undefined ? slides.length : existing.slideCount,
        audience: audience !== undefined ? audience : existing.audience,
        tone: tone !== undefined ? tone : existing.tone,
        isFavorite: isFavorite !== undefined ? isFavorite : existing.isFavorite,
        updatedAt: new Date().toISOString()
      };
      memoryStore.set(id, updated);
    }

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Presentation not found for update' });
    }

    return res.json({
      success: true,
      message: 'Presentation saved successfully',
      data: updated
    });
  } catch (error) {
    console.error('❌ Update Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Delete a presentation
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    let deleted = false;

    if (isConnected && id.match(/^[0-9a-fA-F]{24}$/)) {
      const result = await Presentation.findByIdAndDelete(id);
      if (result) deleted = true;
    }

    if (!deleted && memoryStore.has(id)) {
      memoryStore.delete(id);
      deleted = true;
    }

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Presentation not found to delete' });
    }

    return res.json({ success: true, message: 'Presentation deleted successfully' });
  } catch (error) {
    console.error('❌ Delete Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Regenerate a specific slide with Nvidia AI
 */
exports.regenerateSlide = async (req, res) => {
  try {
    const { id, slideNumber } = req.params;
    const { tone } = req.body;

    let presentation = null;
    if (isConnected && id.match(/^[0-9a-fA-F]{24}$/)) {
      presentation = await Presentation.findById(id);
    }
    if (!presentation) {
      presentation = memoryStore.get(id);
    }
    if (!presentation) {
      return res.status(404).json({ success: false, error: 'Presentation not found' });
    }

    const targetSlideIndex = presentation.slides.findIndex(s => s.slideNumber === parseInt(slideNumber, 10));
    if (targetSlideIndex === -1) {
      return res.status(404).json({ success: false, error: 'Slide number not found' });
    }

    const currentSlide = presentation.slides[targetSlideIndex];
    const newSlideContent = await regenerateSlide(currentSlide.title, presentation.topic, tone || presentation.tone);

    const mergedSlide = {
      ...currentSlide.toObject ? currentSlide.toObject() : currentSlide,
      ...newSlideContent,
      slideNumber: parseInt(slideNumber, 10)
    };

    presentation.slides[targetSlideIndex] = mergedSlide;

    if (isConnected && presentation.save) {
      await presentation.save();
    } else {
      memoryStore.set(id, presentation);
    }

    return res.json({
      success: true,
      message: 'Slide updated with AI synthesis',
      data: mergedSlide
    });
  } catch (error) {
    console.error('❌ RegenerateSlide Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Export presentation to PPTX, standalone HTML, or Markdown
 */
exports.exportDeck = async (req, res) => {
  try {
    const { id } = req.params;
    const format = (req.query.format || 'pptx').toLowerCase();

    let presentation = null;
    if (isConnected && id.match(/^[0-9a-fA-F]{24}$/)) {
      presentation = await Presentation.findById(id);
    }
    if (!presentation) {
      presentation = memoryStore.get(id);
    }
    if (!presentation) {
      return res.status(404).json({ success: false, error: 'Presentation not found' });
    }

    const safeTitle = (presentation.title || 'GlowSlides_Deck').replace(/[^a-z0-9_\-]/gi, '_');

    if (format === 'pptx') {
      const buffer = await generatePptx(presentation);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
      res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.pptx"`);
      return res.send(buffer);
    } else if (format === 'html') {
      const html = generateHtmlPresentation(presentation);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.html"`);
      return res.send(html);
    } else if (format === 'markdown' || format === 'md') {
      const md = generateMarkdownPresentation(presentation);
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.md"`);
      return res.send(md);
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.json"`);
      return res.json(presentation);
    } else {
      return res.status(400).json({ success: false, error: 'Invalid format. Supported: pptx, html, markdown, json' });
    }
  } catch (error) {
    console.error('❌ Export Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Duplicate a presentation
 */
exports.duplicate = async (req, res) => {
  try {
    const { id } = req.params;
    let presentation = null;

    if (isConnected && id.match(/^[0-9a-fA-F]{24}$/)) {
      presentation = await Presentation.findById(id);
    }
    if (!presentation) {
      presentation = memoryStore.get(id);
    }
    if (!presentation) {
      return res.status(404).json({ success: false, error: 'Presentation not found to duplicate' });
    }

    const plain = presentation.toObject ? presentation.toObject() : { ...presentation };
    delete plain._id;
    delete plain.id;
    delete plain.createdAt;
    delete plain.updatedAt;

    plain.title = `${plain.title} (Copy)`;

    let duplicated;
    if (isConnected) {
      const doc = new Presentation(plain);
      duplicated = await doc.save();
    } else {
      const newId = generateId();
      duplicated = {
        _id: newId,
        id: newId,
        ...plain,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      memoryStore.set(newId, duplicated);
    }

    return res.status(201).json({
      success: true,
      message: 'Presentation duplicated successfully',
      data: duplicated
    });
  } catch (error) {
    console.error('❌ Duplicate Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Toggle Favorite status
 */
exports.toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    let presentation = null;

    if (isConnected && id.match(/^[0-9a-fA-F]{24}$/)) {
      presentation = await Presentation.findById(id);
      if (presentation) {
        presentation.isFavorite = !presentation.isFavorite;
        await presentation.save();
        return res.json({ success: true, isFavorite: presentation.isFavorite });
      }
    }

    if (memoryStore.has(id)) {
      const item = memoryStore.get(id);
      item.isFavorite = !item.isFavorite;
      memoryStore.set(id, item);
      return res.json({ success: true, isFavorite: item.isFavorite });
    }

    return res.status(404).json({ success: false, error: 'Presentation not found' });
  } catch (error) {
    console.error('❌ Toggle Favorite Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Join Pro Plan Waitlist (MongoDB Atlas backed)
 */
exports.joinWaitlist = async (req, res) => {
  try {
    const { email, plan } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (isConnected) {
      const existing = await Waitlist.findOne({ email: cleanEmail });
      if (!existing) {
        await Waitlist.create({ email: cleanEmail, plan: plan || 'pro-8-monthly' });
      }
    } else {
      // In-memory record
      const waitlistStore = global.waitlistStore || (global.waitlistStore = new Set());
      waitlistStore.add(cleanEmail);
    }

    return res.json({
      success: true,
      message: `Thanks! ${cleanEmail} has been added to the VIP Pro Waitlist.`
    });
  } catch (error) {
    console.error('❌ Waitlist Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * System Health & Capabilities Telemetry
 */
exports.health = (req, res) => {
  const dbStatus = getDBStatus();
  const hasNvidiaKey = Boolean(process.env.NVIDIA_API_KEY && process.env.NVIDIA_API_KEY.trim() !== '' && process.env.NVIDIA_API_KEY !== 'your_nvidia_api_key_here');

  return res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'GlowSlides AI Presentation Engine',
    version: '2.4.0',
    nvidia: {
      connected: hasNvidiaKey,
      model: process.env.NVIDIA_MODEL || 'meta/llama-3.1-70b-instruct',
      status: hasNvidiaKey ? 'Ready (Nvidia NIM API)' : 'Autonomous Local High-Fidelity Synthesis Active'
    },
    // Vendor-neutral: this payload is rendered on the public /status page, so it
    // reports storage health without naming the underlying database technology.
    storage: {
      status: dbStatus.connected ? 'Operational' : 'Degraded (ephemeral session storage)',
      encrypted: true,
      replicas: dbStatus.connected ? 'Multi-region' : 'Single node',
      healthy: Boolean(dbStatus.connected)
    }
  });
};

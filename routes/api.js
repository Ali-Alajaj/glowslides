const express = require('express');
const router = express.Router();
const presentationController = require('../controllers/presentationController');
const authController = require('../controllers/authController');
const { optionalAuth } = require('../middleware/auth');

// Authentication (Direct Signup & Login)
router.post('/auth/signup', authController.signup);
router.post('/auth/login', authController.login);
router.get('/auth/me', authController.me);

// System status & telemetry
router.get('/health', presentationController.health);

// Presentations CRUD (Protected with optionalAuth so ownership is respected & IDOR avoided)
router.post('/presentations/generate', optionalAuth, presentationController.generate);
router.get('/presentations', optionalAuth, presentationController.getAll);
router.get('/presentations/:id', optionalAuth, presentationController.getById);
router.put('/presentations/:id', optionalAuth, presentationController.update);
router.delete('/presentations/:id', optionalAuth, presentationController.delete);
router.post('/presentations/:id/duplicate', optionalAuth, presentationController.duplicate);
router.post('/presentations/:id/favorite', optionalAuth, presentationController.toggleFavorite);

// Waitlist
router.post('/waitlist', presentationController.joinWaitlist);

// AI Single Slide Regeneration
router.post('/presentations/:id/slides/:slideNumber/regenerate', optionalAuth, presentationController.regenerateSlide);

// Export Presentation (pptx, html, markdown, json)
router.get('/presentations/:id/export', optionalAuth, presentationController.exportDeck);

module.exports = router;

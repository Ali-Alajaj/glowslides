const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isConnected } = require('../services/db');

// In-memory user store when MongoDB is not connected
const memUsers = new Map();

const JWT_SECRET = process.env.JWT_SECRET || 'glowslides-super-secret-jwt-key-2026-production';

/**
 * Direct Instant Sign Up (No verification code required)
 */
exports.signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || '').trim();

    // Check if user already exists
    let existingUser = null;
    if (isConnected) {
      existingUser = await User.findOne({ email: cleanEmail });
    } else {
      existingUser = memUsers.get(cleanEmail);
    }

    if (existingUser && existingUser.password) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists. Please sign in.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    let userObj = null;
    if (isConnected) {
      if (existingUser) {
        existingUser.password = hashedPassword;
        existingUser.name = cleanName || existingUser.name;
        existingUser.isVerified = true;
        existingUser.lastLogin = new Date();
        userObj = await existingUser.save();
      } else {
        userObj = await User.create({
          email: cleanEmail,
          password: hashedPassword,
          name: cleanName || cleanEmail.split('@')[0],
          isVerified: true,
          lastLogin: new Date()
        });
      }
    } else {
      userObj = {
        email: cleanEmail,
        password: hashedPassword,
        name: cleanName || cleanEmail.split('@')[0],
        isVerified: true,
        createdAt: new Date(),
        lastLogin: new Date()
      };
      memUsers.set(cleanEmail, userObj);
    }

    // Issue JWT token
    const token = jwt.sign(
      { email: cleanEmail, name: userObj.name || cleanEmail.split('@')[0], isVerified: true },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        email: cleanEmail,
        name: userObj.name || cleanEmail.split('@')[0]
      }
    });
  } catch (error) {
    console.error('❌ Direct Signup Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create account. Please try again.' });
  }
};

/**
 * Standard Sign In (with password)
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    let user = null;
    if (isConnected) {
      user = await User.findOne({ email: cleanEmail });
    } else {
      user = memUsers.get(cleanEmail);
    }

    // If user exists and has a password set, check it
    if (user && user.password && password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid password. Please check your credentials.' });
      }
    }

    // Issue JWT token
    const token = jwt.sign(
      { email: cleanEmail, name: (user && user.name) || cleanEmail.split('@')[0] },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      message: 'Signed in successfully!',
      token,
      user: {
        email: cleanEmail,
        name: (user && user.name) || cleanEmail.split('@')[0]
      }
    });
  } catch (error) {
    console.error('❌ Login Error:', error);
    return res.status(500).json({ success: false, error: 'Login failed. Please try again.' });
  }
};

/**
 * Get Current User Profile
 */
exports.me = (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ success: true, user: decoded });
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

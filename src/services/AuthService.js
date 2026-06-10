const jwt = require('jsonwebtoken');
const { secret, expiresIn } = require('../config/jwt');
const { User } = require('../models/index');

// SOLID — Single Responsibility
// This class ONLY handles auth business logic

class AuthService {

  // Generate JWT token
  generateToken(userId) {
    return jwt.sign(
      { id: userId },
      secret,
      { expiresIn }
    );
  }

  // Register new user
  async register(name, email, password) {
    // Check if email already exists
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      const error = new Error('Email already registered');
      error.status = 400;
      throw error;
    }

    // Create user — password hashed automatically in model hook
    const user = await User.create({ name, email, password });

    // Generate token
    const token = this.generateToken(user.id);

    return { user, token };
  }

  // Login user
  async login(email, password) {
    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      const error = new Error('Invalid email or password');
      error.status = 401;
      throw error;
    }

    // Compare password using instance method from User model
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.status = 401;
      throw error;
    }

    // Generate token
    const token = this.generateToken(user.id);

    return { user, token };
  }

  // Get user profile
  async getProfile(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }
    return user;
  }
}

module.exports = new AuthService();
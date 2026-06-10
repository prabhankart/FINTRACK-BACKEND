const jwt = require('jsonwebtoken');
const { secret } = require('../config/jwt');
const { User } = require('../models/index');

// Protect routes — verify JWT token
const protect = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, access denied',
        data: null
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    // Verify token — CN concept, signature verification
    const decoded = jwt.verify(token, secret);

    // Find user from token payload
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists',
        data: null
      });
    }

    // Attach user to request object
    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      data: null
    });
  }
};

module.exports = { protect };
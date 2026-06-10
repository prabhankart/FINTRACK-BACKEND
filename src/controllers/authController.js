const authService = require('../services/AuthService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

// SOLID — Controller only handles HTTP layer
// Business logic is in AuthService

const register = async (req, res) => {
  const { name, email, password } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return sendError(res, 'Name, email and password are required', 400);
  }

  const { user, token } = await authService.register(name, email, password);

  return sendSuccess(res, { user, token }, 'Registration successful', 201);
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 'Email and password are required', 400);
  }

  const { user, token } = await authService.login(email, password);

  return sendSuccess(res, { user, token }, 'Login successful');
};

const getProfile = async (req, res) => {
  // req.user set by auth middleware
  const user = await authService.getProfile(req.user.id);
  return sendSuccess(res, { user }, 'Profile fetched');
};

module.exports = { register, login, getProfile };
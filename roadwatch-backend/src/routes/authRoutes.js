const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  createMaintenance,
  createAdmin
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Validation Rules
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const maintenanceRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('teamId').isMongoId().withMessage('Valid Team ID is required')
];

const adminRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

// Public Routes
router.post('/register', authLimiter, registerRules, validate, register);
router.post('/login', authLimiter, loginRules, validate, login);

// Private Routes
router.get('/me', protect, getMe);

// Admin-Only Routes
router.post(
  '/maintenance',
  protect,
  authorize('admin'),
  maintenanceRules,
  validate,
  createMaintenance
);

router.post(
  '/admin',
  protect,
  authorize('admin'),
  adminRules,
  validate,
  createAdmin
);

module.exports = router;


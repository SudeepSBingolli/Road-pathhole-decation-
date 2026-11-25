const express = require('express');
const { body } = require('express-validator');
const {
  getMyTeamTasks,
  updateTaskStatus,
  submitRepair
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');
const { uploadRepairImages } = require('../middleware/upload');
const { validate } = require('../middleware/validator');

const router = express.Router();

// Validation Rules
const statusRules = [
  body('status')
    .equals('in-progress')
    .withMessage("Task status can only be updated to 'in-progress' via this route")
];

const repairRules = [
  body('timeTakenHours')
    .isFloat({ min: 0.1 })
    .withMessage('timeTakenHours is required and must be a positive number')
];

// All task routes require maintenance or admin authentication
router.use(protect);

// 1. Get my team's assigned tasks
router.get('/', authorize('maintenance', 'admin'), getMyTeamTasks);

// 2. Start working on task -> in-progress
router.patch(
  '/:id/status',
  authorize('maintenance', 'admin'),
  statusRules,
  validate,
  updateTaskStatus
);

// 3. Submit repair (photos, notes, materials, hours) -> repair-completed
router.post(
  '/:id/repair',
  authorize('maintenance', 'admin'),
  uploadRepairImages,
  repairRules,
  validate,
  submitRepair
);

module.exports = router;


const express = require('express');
const { body, query } = require('express-validator');
const {
  createReport,
  getNearbyReports,
  listReports,
  getReportById,
  setPriority,
  updateReportStatus,
  assignTeam
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');
const { uploadReportImages } = require('../middleware/upload');
const { validate } = require('../middleware/validator');
const { reportCreationLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Validation Rules
const createReportRules = [
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('area').trim().notEmpty().withMessage('Area is required'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be a valid float between -90 and 90'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be a valid float between -180 and 180'),
  body('lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('lat must be between -90 and 90'),
  body('lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('lng must be between -180 and 180')
];

const nearbyRules = [
  query('lat').isFloat({ min: -90, max: 90 }).withMessage('lat is required and must be between -90 and 90'),
  query('lng').isFloat({ min: -180, max: 180 }).withMessage('lng is required and must be between -180 and 180'),
  query('radius').optional().isFloat({ min: 1 }).withMessage('radius must be a positive number')
];

const assignTeamRules = [
  body('teamId').isMongoId().withMessage('Valid teamId is required'),
  body('dueDate').isISO8601().toDate().withMessage('Valid dueDate in ISO8601 format is required')
];

const priorityRules = [
  body('priority')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be one of: low, medium, high, critical')
];

const statusRules = [
  body('status')
    .isIn(['under-review', 'rejected', 'duplicate'])
    .withMessage('Status must be one of: under-review, rejected, duplicate')
];

// Routes
// 1. Nearby Query ($geoNear)
router.get('/nearby', nearbyRules, validate, getNearbyReports);

// 2. Submit Report (Multipart up to 3 images, 25m duplicate check)
router.post(
  '/',
  protect,
  authorize('citizen', 'admin'),
  reportCreationLimiter,
  uploadReportImages,
  createReportRules,
  validate,
  createReport
);

// 3. List Reports with filters & pagination
router.get('/', protect, listReports);

// 4. Get Report details
router.get('/:id', protect, getReportById);

// 5. Admin: Set priority manually
router.patch(
  '/:id/priority',
  protect,
  authorize('admin'),
  priorityRules,
  validate,
  setPriority
);

// 6. Admin: Reject, mark duplicate, or review status
router.patch(
  '/:id/status',
  protect,
  authorize('admin'),
  statusRules,
  validate,
  updateReportStatus
);

// 7. Admin: Assign team with dueDate
router.patch(
  '/:id/assign',
  protect,
  authorize('admin'),
  assignTeamRules,
  validate,
  assignTeam
);

module.exports = router;


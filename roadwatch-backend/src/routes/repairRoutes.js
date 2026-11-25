const express = require('express');
const { body } = require('express-validator');
const {
  verifyRepair,
  getRepairById,
  listRepairs
} = require('../controllers/repairController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

const verifyRules = [
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage("Status must be either 'approved' or 'rejected'")
];

router.use(protect);

// 1. Admin verifies repair
router.patch(
  '/:id/verify',
  authorize('admin'),
  verifyRules,
  validate,
  verifyRepair
);

// 2. Get repair details
router.get('/:id', getRepairById);

// 3. List repairs
router.get('/', listRepairs);

module.exports = router;


const express = require('express');
const { body } = require('express-validator');
const {
  createTeam,
  listTeams,
  getTeamById,
  addTeamMember
} = require('../controllers/teamController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

const createTeamRules = [
  body('name').trim().notEmpty().withMessage('Team name is required'),
  body('area').trim().notEmpty().withMessage('Operating area is required')
];

const addMemberRules = [
  body('userId').isMongoId().withMessage('Valid userId is required')
];

router.use(protect);

router.post('/', authorize('admin'), createTeamRules, validate, createTeam);
router.get('/', listTeams);
router.get('/:id', getTeamById);
router.post('/:id/members', authorize('admin'), addMemberRules, validate, addTeamMember);

module.exports = router;


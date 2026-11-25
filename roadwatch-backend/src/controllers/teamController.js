const Team = require('../models/Team');
const User = require('../models/User');

/**
 * @desc    Create a new maintenance team
 * @route   POST /api/teams
 * @access  Private (Admin only)
 */
const createTeam = async (req, res, next) => {
  try {
    const { name, area } = req.body;

    const existingTeam = await Team.findOne({ name: name.trim() });
    if (existingTeam) {
      return res.status(409).json({
        success: false,
        message: `A team named '${name}' already exists`
      });
    }

    const team = await Team.create({
      name: name.trim(),
      area: area.trim(),
      members: []
    });

    res.status(201).json({
      success: true,
      message: `Team '${team.name}' created successfully`,
      data: team
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    List all maintenance teams with member count and details
 * @route   GET /api/teams
 * @access  Private (Admin or Maintenance)
 */
const listTeams = async (req, res, next) => {
  try {
    const teams = await Team.find()
      .populate('members', 'name email phone role isActive')
      .sort({ name: 1 });

    const formatted = teams.map((team) => ({
      _id: team._id,
      name: team.name,
      area: team.area,
      memberCount: team.members.length,
      members: team.members,
      createdAt: team.createdAt
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get a specific team by ID
 * @route   GET /api/teams/:id
 * @access  Private
 */
const getTeamById = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id).populate(
      'members',
      'name email phone role isActive'
    );

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Assign an existing user to a team
 * @route   POST /api/teams/:id/members
 * @access  Private (Admin only)
 */
const addTeamMember = async (req, res, next) => {
  try {
    const { userId } = req.body;

    const [team, user] = await Promise.all([
      Team.findById(req.params.id),
      User.findById(userId)
    ]);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'maintenance') {
      return res.status(400).json({
        success: false,
        message: 'Only users with role maintenance can be added to a maintenance team'
      });
    }

    if (!team.members.includes(user._id)) {
      team.members.push(user._id);
      await team.save();
    }

    user.team = team._id;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User '${user.name}' added to team '${team.name}'`,
      data: team
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTeam,
  listTeams,
  getTeamById,
  addTeamMember
};


const User = require('../models/User');
const Team = require('../models/Team');

/**
 * @desc    Register a new citizen user
 * @route   POST /api/auth/register
 * @access  Public (Citizen only)
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists'
      });
    }

    // Role is strictly enforced as citizen for public registration
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role: 'citizen',
      isActive: true
    });

    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      message: 'Citizen registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Log in an existing user (citizen, admin, or maintenance)
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and explicitly select password field
    const user = await User.findOne({ email: email ? email.toLowerCase().trim() : '' })
      .select('+password')
      .populate('team', 'name area');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact an administrator.'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          team: user.team
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get current logged in user profile
 * @route   GET /api/auth/me
 * @access  Private (All authenticated roles)
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('team', 'name area');

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          team: user.team,
          createdAt: user.createdAt
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Admin creates a maintenance account and assigns them to a team
 * @route   POST /api/auth/maintenance
 * @access  Private (Admin only)
 */
const createMaintenance = async (req, res, next) => {
  try {
    const { name, email, password, phone, teamId } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists'
      });
    }

    // Verify team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: `Team with ID '${teamId}' not found`
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role: 'maintenance',
      team: team._id,
      isActive: true
    });

    // Add user to team members list
    if (!team.members.includes(user._id)) {
      team.members.push(user._id);
      await team.save();
    }

    res.status(201).json({
      success: true,
      message: `Maintenance staff '${user.name}' created and assigned to team '${team.name}'`,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          team: {
            id: team._id,
            name: team.name,
            area: team.area
          }
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Admin creates another Admin account
 * @route   POST /api/auth/admin
 * @access  Private (Admin only)
 */
const createAdmin = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists'
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role: 'admin',
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: `Admin account '${user.name}' created successfully`,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getMe,
  createMaintenance,
  createAdmin
};


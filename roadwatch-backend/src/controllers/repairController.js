const Repair = require('../models/Repair');
const Report = require('../models/Report');
const Team = require('../models/Team');
const { notifyAndEmit } = require('../config/socket');

/**
 * @desc    Admin verifies a repair submission (Approve or Reject for rework)
 * @route   PATCH /api/repairs/:id/verify
 * @access  Private (Admin only)
 */
const verifyRepair = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Verification status must be either 'approved' or 'rejected'"
      });
    }

    const repair = await Repair.findById(req.params.id);
    if (!repair) {
      return res.status(404).json({
        success: false,
        message: 'Repair record not found'
      });
    }

    const report = await Report.findById(repair.report);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Associated report not found'
      });
    }

    const team = await Team.findById(repair.team).populate('members', '_id');
    const teamMemberIds = team ? team.members.map((m) => m._id) : [];

    // 1. Update verification subdocument on Repair
    repair.verification = {
      status,
      by: req.user._id,
      remarks: remarks || '',
      at: new Date()
    };
    await repair.save();

    // 2. Transition Report status accordingly
    let reportNewStatus;
    let historyNote;

    if (status === 'approved') {
      reportNewStatus = 'verified';
      historyNote = remarks
        ? `Repair approved by admin ${req.user.name}: ${remarks}`
        : `Repair approved by admin ${req.user.name}. Pothole issue closed.`;
    } else {
      // If rejected, sent back to in-progress for rework
      reportNewStatus = 'in-progress';
      historyNote = remarks
        ? `Repair rejected by admin ${req.user.name}. Rework required: ${remarks}`
        : `Repair rejected by admin ${req.user.name}. Sent back to in-progress for rework.`;
    }

    report.status = reportNewStatus;
    report.statusHistory.push({
      status: reportNewStatus,
      by: req.user._id,
      note: historyNote,
      at: new Date()
    });
    await report.save();

    // 3. Emit realtime socket events & notifications
    const targetRooms = [
      `team:${repair.team.toString()}`,
      `user:${report.citizen.toString()}`,
      'role:admin'
    ];

    await notifyAndEmit({
      event: 'repair:verified',
      rooms: targetRooms,
      data: {
        repairId: repair._id,
        reportId: report._id,
        complaintId: report.complaintId,
        verificationStatus: status,
        reportStatus: reportNewStatus,
        remarks: remarks || '',
        verifiedBy: req.user.name
      },
      message:
        status === 'approved'
          ? `Great news! Pothole repair for ${report.complaintId} has been verified and approved.`
          : `Repair for ${report.complaintId} was rejected by admin. Rework requested: ${remarks || 'Needs improvement'}`,
      reportId: report._id,
      recipientUserIds: [...teamMemberIds, report.citizen]
    });

    res.status(200).json({
      success: true,
      message: `Repair has been ${status}`,
      data: {
        repair,
        report
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get detailed repair by ID
 * @route   GET /api/repairs/:id
 * @access  Private
 */
const getRepairById = async (req, res, next) => {
  try {
    const repair = await Repair.findById(req.params.id)
      .populate('report', 'complaintId address area location priority status')
      .populate('team', 'name area')
      .populate('submittedBy', 'name email phone')
      .populate('verification.by', 'name email');

    if (!repair) {
      return res.status(404).json({
        success: false,
        message: 'Repair not found'
      });
    }

    res.status(200).json({
      success: true,
      data: repair
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    List repairs with filtering
 * @route   GET /api/repairs
 * @access  Private
 */
const listRepairs = async (req, res, next) => {
  try {
    const { reportId, teamId, status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (reportId) query.report = reportId;
    if (teamId) query.team = teamId;
    if (status) query['verification.status'] = status;

    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const skip = (parsedPage - 1) * parsedLimit;

    const [repairs, total] = await Promise.all([
      Repair.find(query)
        .populate('report', 'complaintId address area status priority')
        .populate('team', 'name area')
        .populate('submittedBy', 'name phone')
        .populate('verification.by', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit),
      Repair.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      total,
      page: parsedPage,
      pages: Math.ceil(total / parsedLimit),
      count: repairs.length,
      data: repairs
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  verifyRepair,
  getRepairById,
  listRepairs
};


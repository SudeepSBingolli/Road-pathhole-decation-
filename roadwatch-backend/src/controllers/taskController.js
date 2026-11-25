const Report = require('../models/Report');
const Repair = require('../models/Repair');
const { uploadToCloudinary } = require('../config/cloudinary');
const { notifyAndEmit } = require('../config/socket');

/**
 * @desc    Get tasks assigned to the logged-in maintenance user's team
 * @route   GET /api/tasks
 * @access  Private (Maintenance only)
 */
const getMyTeamTasks = async (req, res, next) => {
  try {
    if (!req.user.team) {
      return res.status(400).json({
        success: false,
        message: 'Your account is not assigned to any maintenance team'
      });
    }

    const { status } = req.query;
    const query = { assignedTeam: req.user.team };

    if (status) {
      query.status = status;
    } else {
      // Default to active tasks
      query.status = { $in: ['assigned', 'in-progress', 'repair-completed'] };
    }

    const tasks = await Report.find(query)
      .populate('citizen', 'name phone')
      .populate('assignedTeam', 'name area')
      .sort({ priority: -1, dueDate: 1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      teamId: req.user.team,
      data: tasks
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Maintenance starts working on assigned task (transitions status to 'in-progress')
 * @route   PATCH /api/tasks/:id/status
 * @access  Private (Maintenance or Admin)
 */
const updateTaskStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;

    if (status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: "Status update on this endpoint only supports transitioning to 'in-progress'"
      });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Task/Report not found'
      });
    }

    // Verify maintenance user belongs to assigned team
    if (
      req.user.role === 'maintenance' &&
      (!report.assignedTeam || report.assignedTeam.toString() !== req.user.team.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: 'This task is not assigned to your team'
      });
    }

    report.status = 'in-progress';
    report.statusHistory.push({
      status: 'in-progress',
      by: req.user._id,
      note: note || `Work initiated by ${req.user.name}`,
      at: new Date()
    });

    await report.save();

    // Realtime notification
    await notifyAndEmit({
      event: 'report:statusChanged',
      rooms: [`user:${report.citizen.toString()}`, 'role:admin', `team:${report.assignedTeam.toString()}`],
      data: {
        reportId: report._id,
        complaintId: report.complaintId,
        status: report.status,
        note
      },
      message: `Repair work for ${report.complaintId} is now in-progress.`,
      reportId: report._id,
      recipientUserIds: [report.citizen]
    });

    res.status(200).json({
      success: true,
      message: "Task status updated to 'in-progress'",
      data: report
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Submit repair with before/after photos and notes (transitions status to 'repair-completed')
 * @route   POST /api/tasks/:id/repair
 * @access  Private (Maintenance only)
 */
const submitRepair = async (req, res, next) => {
  try {
    const { notes, timeTakenHours, materialsUsed } = req.body;

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Task/Report not found'
      });
    }

    if (!report.assignedTeam || report.assignedTeam.toString() !== req.user.team.toString()) {
      return res.status(403).json({
        success: false,
        message: 'This task is not assigned to your team'
      });
    }

    // Upload before images to Cloudinary
    const beforeImages = [];
    if (req.files && req.files.beforeImages) {
      for (const file of req.files.beforeImages) {
        const uploadResult = await uploadToCloudinary(file.buffer, 'roadwatch/repairs/before');
        beforeImages.push({
          url: uploadResult.url,
          publicId: uploadResult.publicId
        });
      }
    }

    // Upload after images to Cloudinary
    const afterImages = [];
    if (req.files && req.files.afterImages) {
      for (const file of req.files.afterImages) {
        const uploadResult = await uploadToCloudinary(file.buffer, 'roadwatch/repairs/after');
        afterImages.push({
          url: uploadResult.url,
          publicId: uploadResult.publicId
        });
      }
    }

    // Format materialsUsed: parse JSON array string or comma separated if sent in multipart
    let parsedMaterials = [];
    if (materialsUsed) {
      if (Array.isArray(materialsUsed)) {
        parsedMaterials = materialsUsed;
      } else {
        try {
          parsedMaterials = JSON.parse(materialsUsed);
        } catch {
          parsedMaterials = materialsUsed.split(',').map((m) => m.trim()).filter(Boolean);
        }
      }
    }

    // 1. Create Repair document
    const repair = await Repair.create({
      report: report._id,
      team: req.user.team,
      submittedBy: req.user._id,
      beforeImages,
      afterImages,
      notes: notes || '',
      materialsUsed: parsedMaterials,
      timeTakenHours: parseFloat(timeTakenHours) || 1,
      completedAt: new Date(),
      verification: {
        status: 'pending'
      }
    });

    // 2. Transition Report status to 'repair-completed'
    report.status = 'repair-completed';
    report.statusHistory.push({
      status: 'repair-completed',
      by: req.user._id,
      note: `Repair completed by team. Submitted for admin verification. Time: ${timeTakenHours} hrs.`,
      at: new Date()
    });

    await report.save();

    // 3. Emit realtime socket events & notifications
    await notifyAndEmit({
      event: 'repair:submitted',
      rooms: ['role:admin', `user:${report.citizen.toString()}`],
      data: {
        repairId: repair._id,
        reportId: report._id,
        complaintId: report.complaintId,
        teamId: req.user.team,
        submittedBy: req.user.name,
        timeTakenHours: repair.timeTakenHours
      },
      message: `Repair completed for ${report.complaintId} by team. Awaiting admin verification.`,
      reportId: report._id,
      recipientUserIds: [report.citizen]
    });

    res.status(201).json({
      success: true,
      message: 'Repair submitted successfully and awaits admin verification',
      data: {
        repair,
        report
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyTeamTasks,
  updateTaskStatus,
  submitRepair
};


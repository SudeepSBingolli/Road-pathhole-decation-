const Report = require('../models/Report');
const Team = require('../models/Team');
const User = require('../models/User');
const { uploadToCloudinary } = require('../config/cloudinary');
const { generateComplaintId } = require('../utils/complaintIdGenerator');
const { calculatePriority } = require('../utils/priorityCalculator');
const { notifyAndEmit } = require('../config/socket');
const { detectRoadDamage } = require('../services/aiService');

/**
 * @desc    Submit a new pothole report with 25m duplicate proximity detection
 * @route   POST /api/reports
 * @access  Private (Citizen or Admin)
 */
const createReport = async (req, res, next) => {
  try {
    const { description, address, area, latitude, longitude, lat, lng } = req.body;

    const parsedLat = parseFloat(latitude || lat);
    const parsedLng = parseFloat(longitude || lng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      return res.status(400).json({
        success: false,
        message: 'Valid latitude and longitude numbers are required'
      });
    }

    if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Latitude must be between -90 and 90, Longitude between -180 and 180'
      });
    }

    // 1. Upload files to Cloudinary (up to 3 images) and run YOLO AI Detection
    const uploadedImages = [];
    let aiDetectionResult = null;

    if (req.files && req.files.length > 0) {
      // Run YOLO inference on the primary photo
      aiDetectionResult = await detectRoadDamage(req.files[0].buffer, req.files[0].originalname);

      for (const file of req.files) {
        const uploadResult = await uploadToCloudinary(file.buffer, 'roadwatch/reports');
        uploadedImages.push({
          url: uploadResult.url,
          publicId: uploadResult.publicId
        });
      }
    }

    // 2. Query for an OPEN existing report within 25 meters ($near query)
    const openStatuses = ['submitted', 'under-review', 'assigned', 'in-progress', 'repair-completed'];

    const existingReport = await Report.findOne({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parsedLng, parsedLat]
          },
          $maxDistance: 25 // 25 meters
        }
      },
      status: { $in: openStatuses },
      duplicateOf: null // Match primary open reports
    });

    // -------------------------------------------------------------
    // CASE A: Existing report found within 25m -> LINKED DUPLICATE
    // -------------------------------------------------------------
    if (existingReport) {
      // Increment complaint count
      existingReport.complaintCount += 1;

      // Add citizen to upvotes if not already included
      const hasUpvoted = existingReport.upvotes.some(
        (userId) => userId.toString() === req.user._id.toString()
      );
      if (!hasUpvoted) {
        existingReport.upvotes.push(req.user._id);
      }

      // Auto-recalculate priority based on new count
      const updatedPriority = calculatePriority(existingReport.complaintCount);
      existingReport.priority = updatedPriority;

      // Add status history entry to existing report
      existingReport.statusHistory.push({
        status: existingReport.status,
        by: req.user._id,
        note: `Linked duplicate report submitted by ${req.user.name}. Total complaints: ${existingReport.complaintCount}. Priority escalated to ${updatedPriority}.`,
        at: new Date()
      });

      await existingReport.save();

      // Create linked duplicate document for the reporting citizen's record
      const duplicateComplaintId = await generateComplaintId();
      const duplicateReport = await Report.create({
        complaintId: duplicateComplaintId,
        citizen: req.user._id,
        images: uploadedImages,
        description: description || `Duplicate report of ${existingReport.complaintId}`,
        location: {
          type: 'Point',
          coordinates: [parsedLng, parsedLat]
        },
        address: address || existingReport.address,
        area: area || existingReport.area,
        priority: updatedPriority,
        complaintCount: 1,
        upvotes: [req.user._id],
        duplicateOf: existingReport._id,
        status: 'duplicate',
        statusHistory: [
          {
            status: 'duplicate',
            by: req.user._id,
            note: `Automatically linked as duplicate of complaint ${existingReport.complaintId} (within 25m threshold).`,
            at: new Date()
          }
        ]
      });

      // Realtime Notification & Socket Emission
      await notifyAndEmit({
        event: 'report:statusChanged',
        rooms: ['role:admin', `user:${existingReport.citizen.toString()}`],
        data: {
          reportId: existingReport._id,
          complaintId: existingReport.complaintId,
          complaintCount: existingReport.complaintCount,
          priority: existingReport.priority,
          duplicateReportId: duplicateReport._id
        },
        message: `Pothole complaint ${existingReport.complaintId} received another report within 25m! Total: ${existingReport.complaintCount}, Priority: ${existingReport.priority}`,
        reportId: existingReport._id,
        recipientUserIds: [existingReport.citizen]
      });

      return res.status(200).json({
        success: true,
        isDuplicate: true,
        message: `An open report was found within 25 meters (${existingReport.complaintId}). Your complaint has been linked, upvotes updated, and priority recalculated to '${updatedPriority}'.`,
        data: {
          linkedDuplicateReport: duplicateReport,
          parentReport: existingReport
        }
      });
    }

    // -------------------------------------------------------------
    // CASE B: No open report within 25m -> CREATE NEW REPORT
    // -------------------------------------------------------------
    const newComplaintId = await generateComplaintId();
    let initialPriority = calculatePriority(1); // 'low'
    
    // If AI detects critical or high damage, align initial priority with computer vision analysis
    if (aiDetectionResult && (aiDetectionResult.recommendedPriority === 'critical' || aiDetectionResult.recommendedPriority === 'high')) {
      initialPriority = aiDetectionResult.recommendedPriority;
    }

    const newReport = await Report.create({
      complaintId: newComplaintId,
      citizen: req.user._id,
      images: uploadedImages,
      description,
      location: {
        type: 'Point',
        coordinates: [parsedLng, parsedLat]
      },
      address,
      area,
      priority: initialPriority,
      complaintCount: 1,
      upvotes: [req.user._id],
      status: 'submitted',
      aiDetection: aiDetectionResult ? {
        hasDamage: aiDetectionResult.hasDamage,
        detectedClasses: aiDetectionResult.detectedClasses,
        totalDetections: aiDetectionResult.totalDetections,
        severityScore: aiDetectionResult.severityScore,
        recommendedPriority: aiDetectionResult.recommendedPriority,
        detections: aiDetectionResult.detections,
        annotatedImageUrl: aiDetectionResult.annotatedImageBase64
      } : undefined,
      statusHistory: [
        {
          status: 'submitted',
          by: req.user._id,
          note: aiDetectionResult && aiDetectionResult.hasDamage
            ? `Report submitted with YOLO AI detection: ${aiDetectionResult.totalDetections} hazard(s) identified (${aiDetectionResult.detectedClasses.join(', ')}). Severity: ${aiDetectionResult.severityScore}/10.`
            : 'Initial report submitted by citizen.',
          at: new Date()
        }
      ]
    });

    // Notify Admins in real-time
    await notifyAndEmit({
      event: 'report:new',
      rooms: 'role:admin',
      data: {
        reportId: newReport._id,
        complaintId: newReport.complaintId,
        area: newReport.area,
        address: newReport.address,
        priority: newReport.priority
      },
      message: `New pothole reported: ${newReport.complaintId} at ${newReport.address} (${newReport.area})`,
      reportId: newReport._id
    });

    res.status(201).json({
      success: true,
      isDuplicate: false,
      message: 'Pothole report created successfully',
      data: {
        report: newReport
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get nearby reports using $geoNear aggregation
 * @route   GET /api/reports/nearby
 * @access  Public or Protected
 */
const getNearbyReports = async (req, res, next) => {
  try {
    const { lat, lng, radius, status } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Query parameters lat and lng are required'
      });
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const radiusMeters = parseFloat(radius) || 5000; // default 5km

    const matchQuery = {};
    if (status) {
      matchQuery.status = status;
    } else {
      // By default, exclude individual duplicate records from cluttering the map
      matchQuery.status = { $ne: 'duplicate' };
    }

    const nearbyReports = await Report.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parsedLng, parsedLat]
          },
          distanceField: 'distanceMeters',
          maxDistance: radiusMeters,
          spherical: true,
          query: matchQuery
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'citizen',
          foreignField: '_id',
          as: 'citizen',
          pipeline: [{ $project: { name: 1, email: 1, phone: 1 } }]
        }
      },
      {
        $unwind: {
          path: '$citizen',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'teams',
          localField: 'assignedTeam',
          foreignField: '_id',
          as: 'assignedTeam'
        }
      },
      {
        $unwind: {
          path: '$assignedTeam',
          preserveNullAndEmptyArrays: true
        }
      },
      { $sort: { distanceMeters: 1 } }
    ]);

    res.status(200).json({
      success: true,
      count: nearbyReports.length,
      radiusMeters,
      center: { lat: parsedLat, lng: parsedLng },
      data: nearbyReports
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    List reports with filters and pagination
 * @route   GET /api/reports
 * @access  Private
 */
const listReports = async (req, res, next) => {
  try {
    const {
      status,
      priority,
      area,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10,
      myReports
    } = req.query;

    const query = {};

    // Citizens can see only their reports if specified, or all public reports
    if (req.user.role === 'citizen' && myReports === 'true') {
      query.citizen = req.user._id;
    }

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (area) {
      query.area = { $regex: area, $options: 'i' };
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Search by complaintId, address, or description
    if (search) {
      query.$or = [
        { complaintId: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const skip = (parsedPage - 1) * parsedLimit;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('citizen', 'name email phone')
        .populate('assignedTeam', 'name area')
        .populate('duplicateOf', 'complaintId status priority')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit),
      Report.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      total,
      page: parsedPage,
      pages: Math.ceil(total / parsedLimit),
      count: reports.length,
      data: reports
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get detailed single report by ID
 * @route   GET /api/reports/:id
 * @access  Private
 */
const getReportById = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('citizen', 'name email phone')
      .populate('assignedTeam', 'name area members')
      .populate('statusHistory.by', 'name email role')
      .populate('duplicateOf', 'complaintId address status priority');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Admin sets or overrides priority manually
 * @route   PATCH /api/reports/:id/priority
 * @access  Private (Admin only)
 */
const setPriority = async (req, res, next) => {
  try {
    const { priority, note } = req.body;

    if (!['low', 'medium', 'high', 'critical'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority level. Must be low, medium, high, or critical.'
      });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const oldPriority = report.priority;
    report.priority = priority;
    report.statusHistory.push({
      status: report.status,
      by: req.user._id,
      note: note || `Priority updated from '${oldPriority}' to '${priority}' by admin ${req.user.name}`,
      at: new Date()
    });

    await report.save();

    res.status(200).json({
      success: true,
      message: `Priority updated to ${priority}`,
      data: report
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Admin updates report status (e.g. reject, mark duplicate, under-review)
 * @route   PATCH /api/reports/:id/status
 * @access  Private (Admin only)
 */
const updateReportStatus = async (req, res, next) => {
  try {
    const { status, note, duplicateOf } = req.body;

    const allowedStatuses = ['under-review', 'rejected', 'duplicate'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Admin status update only supports: ${allowedStatuses.join(', ')}. Use /assign to assign a team.`
      });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (status === 'duplicate' && duplicateOf) {
      const parent = await Report.findById(duplicateOf);
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: `Target parent report '${duplicateOf}' does not exist`
        });
      }
      report.duplicateOf = parent._id;
    }

    report.status = status;
    report.statusHistory.push({
      status,
      by: req.user._id,
      note: note || `Status changed to ${status} by admin`,
      at: new Date()
    });

    await report.save();

    // Realtime notification
    await notifyAndEmit({
      event: 'report:statusChanged',
      rooms: [`user:${report.citizen.toString()}`, 'role:admin'],
      data: {
        reportId: report._id,
        complaintId: report.complaintId,
        status: report.status,
        note
      },
      message: `Status of report ${report.complaintId} changed to '${status}'`,
      reportId: report._id,
      recipientUserIds: [report.citizen]
    });

    res.status(200).json({
      success: true,
      message: `Report status updated to '${status}'`,
      data: report
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Admin assigns a report to a maintenance team with due date
 * @route   PATCH /api/reports/:id/assign
 * @access  Private (Admin only)
 */
const assignTeam = async (req, res, next) => {
  try {
    const { teamId, dueDate, note } = req.body;

    if (!teamId || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Both teamId and dueDate are required'
      });
    }

    const team = await Team.findById(teamId).populate('members', '_id');
    if (!team) {
      return res.status(404).json({
        success: false,
        message: `Team '${teamId}' not found`
      });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    report.assignedTeam = team._id;
    report.assignedAt = new Date();
    report.dueDate = new Date(dueDate);
    report.status = 'assigned';
    report.isOverdue = false;

    report.statusHistory.push({
      status: 'assigned',
      by: req.user._id,
      note: note || `Assigned to team '${team.name}'. Due: ${new Date(dueDate).toISOString().split('T')[0]}`,
      at: new Date()
    });

    await report.save();

    const teamMemberIds = team.members.map((m) => m._id);

    // Realtime task notification to the team
    await notifyAndEmit({
      event: 'task:assigned',
      rooms: [`team:${team._id.toString()}`, `user:${report.citizen.toString()}`, 'role:admin'],
      data: {
        reportId: report._id,
        complaintId: report.complaintId,
        teamId: team._id,
        teamName: team.name,
        dueDate: report.dueDate,
        address: report.address
      },
      message: `New repair task assigned to Team ${team.name}: ${report.complaintId} at ${report.address}`,
      reportId: report._id,
      recipientUserIds: [...teamMemberIds, report.citizen]
    });

    res.status(200).json({
      success: true,
      message: `Report assigned to team '${team.name}' successfully`,
      data: report
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createReport,
  getNearbyReports,
  listReports,
  getReportById,
  setPriority,
  updateReportStatus,
  assignTeam
};


const mongoose = require('mongoose');
const Report = require('../models/Report');
const Repair = require('../models/Repair');
const Team = require('../models/Team');

/**
 * @desc    Summary counts by status, priority, and overall metrics
 * @route   GET /api/analytics/summary
 * @access  Private (Admin or Maintenance)
 */
const getSummary = async (req, res, next) => {
  try {
    const summary = await Report.aggregate([
      {
        $facet: {
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          byPriority: [
            { $group: { _id: '$priority', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          overall: [
            {
              $group: {
                _id: null,
                totalReports: { $sum: 1 },
                totalComplaints: { $sum: '$complaintCount' },
                overdueCount: {
                  $sum: { $cond: [{ $eq: ['$isOverdue', true] }, 1, 0] }
                },
                verifiedCount: {
                  $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
                },
                openCount: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          '$status',
                          ['submitted', 'under-review', 'assigned', 'in-progress']
                        ]
                      },
                      1,
                      0
                    ]
                  }
                }
              }
            }
          ]
        }
      }
    ]);

    const result = summary[0];
    const statusMap = {};
    (result.byStatus || []).forEach((item) => {
      statusMap[item._id] = item.count;
    });

    const priorityMap = {};
    (result.byPriority || []).forEach((item) => {
      priorityMap[item._id] = item.count;
    });

    const overall = (result.overall && result.overall[0]) || {
      totalReports: 0,
      totalComplaints: 0,
      overdueCount: 0,
      verifiedCount: 0,
      openCount: 0
    };

    res.status(200).json({
      success: true,
      data: {
        overall,
        byStatus: statusMap,
        byPriority: priorityMap
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Monthly trend of reports created vs reports verified
 * @route   GET /api/analytics/trends
 * @access  Private (Admin or Maintenance)
 */
const getMonthlyTrends = async (req, res, next) => {
  try {
    const monthsBack = parseInt(req.query.months, 10) || 12;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);

    const trends = await Report.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalReported: { $sum: 1 },
          verifiedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
          },
          criticalCount: {
            $sum: { $cond: [{ $eq: ['$priority', 'critical'] }, 1, 0] }
          }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1
        }
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          period: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: [
                  { $lt: ['$_id.month', 10] },
                  { $concat: ['0', { $toString: '$_id.month' }] },
                  { $toString: '$_id.month' }
                ]
              }
            ]
          },
          totalReported: 1,
          verifiedCount: 1,
          criticalCount: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      periodMonths: monthsBack,
      data: trends
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Average repair time in hours
 * @route   GET /api/analytics/avg-repair-time
 * @access  Private (Admin or Maintenance)
 */
const getAvgRepairTime = async (req, res, next) => {
  try {
    const stats = await Repair.aggregate([
      {
        $group: {
          _id: null,
          totalRepairs: { $sum: 1 },
          avgTimeHours: { $avg: '$timeTakenHours' },
          minTimeHours: { $min: '$timeTakenHours' },
          maxTimeHours: { $max: '$timeTakenHours' }
        }
      },
      {
        $project: {
          _id: 0,
          totalRepairs: 1,
          avgTimeHours: { $round: ['$avgTimeHours', 2] },
          minTimeHours: 1,
          maxTimeHours: 1
        }
      }
    ]);

    const data = stats[0] || {
      totalRepairs: 0,
      avgTimeHours: 0,
      minTimeHours: 0,
      maxTimeHours: 0
    };

    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Per-team performance (completed repairs, avg time, overdue count, rework rate)
 * @route   GET /api/analytics/team-performance
 * @access  Private (Admin only)
 */
const getTeamPerformance = async (req, res, next) => {
  try {
    const teams = await Team.find().select('name area');

    // 1. Repair stats by team (completed count, avg time, rework count)
    const repairStats = await Repair.aggregate([
      {
        $group: {
          _id: '$team',
          totalRepairs: { $sum: 1 },
          avgTimeTaken: { $avg: '$timeTakenHours' },
          approvedCount: {
            $sum: { $cond: [{ $eq: ['$verification.status', 'approved'] }, 1, 0] }
          },
          rejectedCount: {
            $sum: { $cond: [{ $eq: ['$verification.status', 'rejected'] }, 1, 0] }
          }
        }
      }
    ]);

    // 2. Overdue & active task stats by team
    const reportStats = await Report.aggregate([
      {
        $match: {
          assignedTeam: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$assignedTeam',
          totalAssigned: { $sum: 1 },
          overdueCount: {
            $sum: { $cond: [{ $eq: ['$isOverdue', true] }, 1, 0] }
          },
          activeCount: {
            $sum: {
              $cond: [
                { $in: ['$status', ['assigned', 'in-progress']] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const repairMap = new Map();
    repairStats.forEach((stat) => {
      repairMap.set(stat._id.toString(), stat);
    });

    const reportMap = new Map();
    reportStats.forEach((stat) => {
      reportMap.set(stat._id.toString(), stat);
    });

    const performance = teams.map((team) => {
      const tId = team._id.toString();
      const rep = repairMap.get(tId) || {
        totalRepairs: 0,
        avgTimeTaken: 0,
        approvedCount: 0,
        rejectedCount: 0
      };
      const repReport = reportMap.get(tId) || {
        totalAssigned: 0,
        overdueCount: 0,
        activeCount: 0
      };

      // Rework rate = rejected repairs / total repairs submitted
      const reworkRate =
        rep.totalRepairs > 0
          ? Math.round((rep.rejectedCount / rep.totalRepairs) * 100 * 10) / 10
          : 0;

      return {
        teamId: team._id,
        teamName: team.name,
        area: team.area,
        totalAssigned: repReport.totalAssigned,
        activeTasks: repReport.activeCount,
        completedRepairs: rep.approvedCount,
        totalSubmittedRepairs: rep.totalRepairs,
        avgTimeHours: Math.round((rep.avgTimeTaken || 0) * 10) / 10,
        overdueTasks: repReport.overdueCount,
        reworkCount: rep.rejectedCount,
        reworkRatePercentage: reworkRate
      };
    });

    res.status(200).json({
      success: true,
      count: performance.length,
      data: performance
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Hotspots analysis grouped by area and geospatial grid cell with counts
 * @route   GET /api/analytics/hotspots
 * @access  Private (Admin or Maintenance)
 */
const getHotspots = async (req, res, next) => {
  try {
    // 1. Group by Administrative Area
    const areaHotspots = await Report.aggregate([
      {
        $group: {
          _id: '$area',
          totalReports: { $sum: 1 },
          totalComplaints: { $sum: '$complaintCount' },
          criticalCount: {
            $sum: { $cond: [{ $eq: ['$priority', 'critical'] }, 1, 0] }
          },
          openCount: {
            $sum: {
              $cond: [
                {
                  $in: [
                    '$status',
                    ['submitted', 'under-review', 'assigned', 'in-progress']
                  ]
                },
                1,
                0
              ]
            }
          },
          verifiedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
          },
          avgLongitude: { $avg: { $arrayElemAt: ['$location.coordinates', 0] } },
          avgLatitude: { $avg: { $arrayElemAt: ['$location.coordinates', 1] } }
        }
      },
      { $sort: { totalReports: -1 } }
    ]);

    // 2. Geospatial Grid-cell Clustering (~1.1km resolution using 2 decimal degrees)
    const gridHotspots = await Report.aggregate([
      {
        $project: {
          gridLng: {
            $round: [{ $arrayElemAt: ['$location.coordinates', 0] }, 2]
          },
          gridLat: {
            $round: [{ $arrayElemAt: ['$location.coordinates', 1] }, 2]
          },
          status: 1,
          priority: 1,
          complaintCount: 1
        }
      },
      {
        $group: {
          _id: {
            lng: '$gridLng',
            lat: '$gridLat'
          },
          density: { $sum: 1 },
          totalComplaints: { $sum: '$complaintCount' },
          criticalCount: {
            $sum: { $cond: [{ $eq: ['$priority', 'critical'] }, 1, 0] }
          }
        }
      },
      { $sort: { density: -1 } },
      { $limit: 50 },
      {
        $project: {
          _id: 0,
          coordinates: ['$_id.lng', '$_id.lat'],
          density: 1,
          totalComplaints: 1,
          criticalCount: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        byArea: areaHotspots,
        gridClusters: gridHotspots
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSummary,
  getMonthlyTrends,
  getAvgRepairTime,
  getTeamPerformance,
  getHotspots
};


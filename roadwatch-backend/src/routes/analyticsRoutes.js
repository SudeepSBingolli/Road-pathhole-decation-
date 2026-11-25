const express = require('express');
const {
  getSummary,
  getMonthlyTrends,
  getAvgRepairTime,
  getTeamPerformance,
  getHotspots
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Analytics endpoints restricted to Admin and Maintenance staff
router.use(protect);
router.use(authorize('admin', 'maintenance'));

router.get('/summary', getSummary);
router.get('/trends', getMonthlyTrends);
router.get('/avg-repair-time', getAvgRepairTime);
router.get('/team-performance', authorize('admin'), getTeamPerformance);
router.get('/hotspots', getHotspots);

module.exports = router;


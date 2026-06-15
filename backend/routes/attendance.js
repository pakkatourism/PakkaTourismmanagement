const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  checkIn, checkOut, getMyAttendance, getDashboardStats,
  getAttendanceTrend, adminGetAll, markManual, getMonthlyStats
} = require('../controllers/attendanceController');

router.post('/checkin',   protect, checkIn);
router.post('/checkout',  protect, checkOut);
router.get('/',           protect, getMyAttendance);
router.get('/stats',      protect, adminOnly, getDashboardStats);
router.get('/monthly',    protect, adminOnly, getMonthlyStats);
router.get('/trend',      protect, getAttendanceTrend);
router.get('/all',        protect, adminOnly, adminGetAll);
router.post('/manual',    protect, adminOnly, markManual);

module.exports = router;

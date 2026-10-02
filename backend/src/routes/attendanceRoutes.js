const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/today', attendanceController.getTodayAttendance);
router.post('/clock-in', requireRole('employee'), attendanceController.clockIn);
router.post('/clock-out', requireRole('employee'), attendanceController.clockOut);
router.get('/', attendanceController.getAttendanceHistory);

module.exports = router;

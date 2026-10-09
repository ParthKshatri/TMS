const express = require('express');
const { body } = require('express-validator');
const attendanceController = require('../controllers/attendanceController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.use(requireAuth);

router.get('/today', attendanceController.getTodayAttendance);
router.post('/clock-in', requireRole('employee'), attendanceController.clockIn);
router.post('/clock-out', requireRole('employee'), attendanceController.clockOut);
router.get('/', attendanceController.getAttendanceHistory);

// Admin pending approvals endpoints
router.get('/pending', requireRole('admin'), attendanceController.getPendingRequests);
router.patch(
  '/:id/approve',
  requireRole('admin'),
  [
    body('requestType')
      .isIn(['clockIn', 'clockOut'])
      .withMessage('requestType must be clockIn or clockOut.'),
    validate
  ],
  attendanceController.approveRequest
);
router.patch(
  '/:id/reject',
  requireRole('admin'),
  [
    body('requestType')
      .isIn(['clockIn', 'clockOut'])
      .withMessage('requestType must be clockIn or clockOut.'),
    body('rejectionReason').optional().isString().trim(),
    validate
  ],
  attendanceController.rejectRequest
);

module.exports = router;

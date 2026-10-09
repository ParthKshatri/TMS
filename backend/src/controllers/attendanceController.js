const Attendance = require('../models/Attendance');
const { getTodayDateString } = require('../utils/dateUtils');

const clockIn = async (req, res, next) => {
  try {
    const today = getTodayDateString();
    const existing = await Attendance.findOne({
      employee: req.user._id,
      date: today
    });

    if (existing) {
      if (existing.clockInStatus === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Clock-in request is already pending administrator approval.'
        });
      }
      if (existing.clockInStatus === 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Attendance login time has already been recorded and approved for today.'
        });
      }
      if (existing.clockInStatus === 'rejected') {
        return res.status(400).json({
          success: false,
          message: 'Clock-in request for today was previously rejected.'
        });
      }
    }

    const attendance = await Attendance.create({
      employee: req.user._id,
      date: today,
      loginTime: new Date(),
      clockInStatus: 'pending',
      clockOutStatus: 'none'
    });

    res.status(201).json({
      success: true,
      message: 'Clock-in request submitted for approval.',
      attendance
    });
  } catch (error) {
    next(error);
  }
};

const clockOut = async (req, res, next) => {
  try {
    const today = getTodayDateString();
    const attendance = await Attendance.findOne({
      employee: req.user._id,
      date: today
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'No clock-in record found for today. Please clock in first.'
      });
    }

    if (attendance.clockInStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot clock out until your clock-in request has been approved by an administrator.'
      });
    }

    if (attendance.clockOutStatus === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Clock-out request is already pending administrator approval.'
      });
    }

    if (attendance.clockOutStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Clock-out time has already been recorded and approved for today.'
      });
    }

    attendance.logoutTime = new Date();
    attendance.clockOutStatus = 'pending';
    attendance.clockOutRejectionReason = undefined;
    await attendance.save();

    res.json({
      success: true,
      message: 'Clock-out request submitted for approval.',
      attendance
    });
  } catch (error) {
    next(error);
  }
};

const getTodayAttendance = async (req, res, next) => {
  try {
    const today = getTodayDateString();
    const attendance = await Attendance.findOne({
      employee: req.user._id,
      date: today
    });

    res.json({
      success: true,
      attendance: attendance || null
    });
  } catch (error) {
    next(error);
  }
};

const getAttendanceHistory = async (req, res, next) => {
  try {
    const { employee, startDate, endDate, page = 1, limit = 10 } = req.query;
    const query = {};

    if (req.user.role === 'employee') {
      query.employee = req.user._id;
    } else if (employee) {
      query.employee = employee;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Attendance.countDocuments(query);
    const records = await Attendance.find(query)
      .populate('employee', 'name email')
      .populate('clockInApprovedBy', 'name email')
      .populate('clockOutApprovedBy', 'name email')
      .sort({ date: -1, loginTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      records,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

const getPendingRequests = async (req, res, next) => {
  try {
    const pendingRecords = await Attendance.find({
      $or: [{ clockInStatus: 'pending' }, { clockOutStatus: 'pending' }]
    })
      .populate('employee', 'name email')
      .sort({ date: -1, loginTime: -1 });

    res.json({
      success: true,
      pendingRequests: pendingRecords,
      total: pendingRecords.length
    });
  } catch (error) {
    next(error);
  }
};

const approveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { requestType } = req.body;

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found.'
      });
    }

    if (requestType === 'clockIn') {
      if (attendance.clockInStatus !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Clock-in request is not pending.'
        });
      }
      attendance.clockInStatus = 'approved';
      attendance.clockInApprovedBy = req.user._id;
      attendance.clockInDecidedAt = new Date();
      attendance.clockInRejectionReason = undefined;
    } else if (requestType === 'clockOut') {
      if (attendance.clockOutStatus !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Clock-out request is not pending.'
        });
      }
      attendance.clockOutStatus = 'approved';
      attendance.clockOutApprovedBy = req.user._id;
      attendance.clockOutDecidedAt = new Date();
      attendance.clockOutRejectionReason = undefined;
    }

    await attendance.save();
    const updated = await Attendance.findById(id)
      .populate('employee', 'name email')
      .populate('clockInApprovedBy', 'name email')
      .populate('clockOutApprovedBy', 'name email');

    res.json({
      success: true,
      message: `${requestType === 'clockIn' ? 'Clock-in' : 'Clock-out'} request approved.`,
      attendance: updated
    });
  } catch (error) {
    next(error);
  }
};

const rejectRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { requestType, rejectionReason } = req.body;

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found.'
      });
    }

    const reason = rejectionReason ? rejectionReason.trim() : 'Rejected by administrator';

    if (requestType === 'clockIn') {
      if (attendance.clockInStatus !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Clock-in request is not pending.'
        });
      }
      attendance.clockInStatus = 'rejected';
      attendance.clockInApprovedBy = req.user._id;
      attendance.clockInDecidedAt = new Date();
      attendance.clockInRejectionReason = reason;
    } else if (requestType === 'clockOut') {
      if (attendance.clockOutStatus !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Clock-out request is not pending.'
        });
      }
      attendance.clockOutStatus = 'rejected';
      attendance.clockOutApprovedBy = req.user._id;
      attendance.clockOutDecidedAt = new Date();
      attendance.clockOutRejectionReason = reason;
    }

    await attendance.save();
    const updated = await Attendance.findById(id)
      .populate('employee', 'name email')
      .populate('clockInApprovedBy', 'name email')
      .populate('clockOutApprovedBy', 'name email');

    res.json({
      success: true,
      message: `${requestType === 'clockIn' ? 'Clock-in' : 'Clock-out'} request rejected.`,
      attendance: updated
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  clockIn,
  clockOut,
  getTodayAttendance,
  getAttendanceHistory,
  getPendingRequests,
  approveRequest,
  rejectRequest
};

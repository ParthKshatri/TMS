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
      return res.status(400).json({
        success: false,
        message: 'Attendance login time has already been recorded for today.'
      });
    }

    const attendance = await Attendance.create({
      employee: req.user._id,
      date: today,
      loginTime: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Clocked in successfully.',
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
        message: 'No active clock in record found for today. Please clock in first.'
      });
    }

    if (attendance.logoutTime) {
      return res.status(400).json({
        success: false,
        message: 'Logout time has already been recorded for today.'
      });
    }

    attendance.logoutTime = new Date();
    await attendance.save();

    res.json({
      success: true,
      message: 'Clocked out successfully.',
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

module.exports = {
  clockIn,
  clockOut,
  getTodayAttendance,
  getAttendanceHistory
};

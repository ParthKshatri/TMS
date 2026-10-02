const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Task = require('../models/Task');
const Attendance = require('../models/Attendance');
const WorkSubmission = require('../models/WorkSubmission');

const getEmployees = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const query = { role: 'employee' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);
    const employees = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      employees,
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

const createEmployee = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An employee with this email already exists.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newEmployee = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'employee',
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Employee account created successfully.',
      employee: {
        id: newEmployee._id,
        name: newEmployee.name,
        email: newEmployee.email,
        role: newEmployee.role,
        isActive: newEmployee.isActive,
        createdAt: newEmployee.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

const getUserDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-passwordHash');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const totalTasks = await Task.countDocuments({ assignee: id });
    const completedTasks = await Task.countDocuments({ assignee: id, status: { $in: ['completed', 'approved'] } });
    const totalWorkSubmissions = await WorkSubmission.countDocuments({ employee: id });
    const totalAttendanceDays = await Attendance.countDocuments({ employee: id });

    res.json({
      success: true,
      user,
      stats: {
        totalTasks,
        completedTasks,
        totalWorkSubmissions,
        totalAttendanceDays
      }
    });
  } catch (error) {
    next(error);
  }
};

const toggleEmployeeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.'
      });
    }

    if (user.role !== 'employee') {
      return res.status(400).json({
        success: false,
        message: 'Only employee accounts can be enabled or disabled.'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `Employee account ${user.isActive ? 'activated' : 'disabled'} successfully.`,
      employee: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployees,
  createEmployee,
  getUserDetails,
  toggleEmployeeStatus
};

const Task = require('../models/Task');
const TaskStatusHistory = require('../models/TaskStatusHistory');
const User = require('../models/User');
const { sendTaskAssignmentEmail } = require('../utils/mailer');

const createTask = async (req, res, next) => {
  try {
    const { title, description, assignee, assignees, dueDate } = req.body;

    let assigneeIds = [];
    if (Array.isArray(assignees) && assignees.length > 0) {
      assigneeIds = [...new Set(assignees.filter(Boolean))];
    } else if (assignee) {
      assigneeIds = [assignee];
    }

    if (assigneeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one employee assignee.'
      });
    }

    const validEmployees = await User.find({
      _id: { $in: assigneeIds },
      role: 'employee',
      isActive: true
    });

    if (validEmployees.length !== assigneeIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more selected employees are invalid or inactive.'
      });
    }

    const createdTaskIds = [];
    const historyEntries = [];
    const now = new Date();

    for (const empId of assigneeIds) {
      const task = await Task.create({
        title: title.trim(),
        description: description.trim(),
        assignee: empId,
        createdBy: req.user._id,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status: 'pending'
      });
      createdTaskIds.push(task._id);

      historyEntries.push({
        task: task._id,
        changedBy: req.user._id,
        fromStatus: 'none',
        toStatus: 'pending',
        changedAt: now
      });
    }

    await TaskStatusHistory.insertMany(historyEntries);

    const populatedTasks = await Task.find({ _id: { $in: createdTaskIds } })
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email');

    // Send task assignment emails in the background without blocking the response
    for (const task of populatedTasks) {
      if (task.assignee && task.assignee.email) {
        sendTaskAssignmentEmail({
          task,
          assigneeName: task.assignee.name,
          assigneeEmail: task.assignee.email,
          assignedByName: req.user.name || task.createdBy?.name || 'Administrator'
        }).catch(() => {});
      }
    }

    res.status(201).json({
      success: true,
      message: `Task successfully assigned to ${populatedTasks.length} employee(s).`,
      tasks: populatedTasks,
      task: populatedTasks[0]
    });
  } catch (error) {
    next(error);
  }
};

const getTasks = async (req, res, next) => {
  try {
    const { assignee, status, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (req.user.role === 'employee') {
      query.assignee = req.user._id;
    } else if (assignee) {
      query.assignee = assignee;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      tasks,
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

const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.'
      });
    }

    if (req.user.role === 'employee' && task.assignee._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your assigned tasks.'
      });
    }

    const history = await TaskStatusHistory.find({ task: id })
      .populate('changedBy', 'name email role')
      .sort({ changedAt: -1 });

    res.json({
      success: true,
      task,
      history
    });
  } catch (error) {
    next(error);
  }
};

const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.'
      });
    }

    if (req.user.role === 'employee' && task.assignee.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update status for your assigned tasks.'
      });
    }

    const validStatuses = ['pending', 'in_progress', 'completed', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task status.'
      });
    }

    if (task.status === status) {
      return res.json({
        success: true,
        message: 'Task status is already set to this value.',
        task
      });
    }

    const oldStatus = task.status;
    task.status = status;
    await task.save();

    await TaskStatusHistory.create({
      task: task._id,
      changedBy: req.user._id,
      fromStatus: oldStatus,
      toStatus: status,
      changedAt: new Date()
    });

    const updatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Task status updated successfully.',
      task: updatedTask
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTaskStatus
};

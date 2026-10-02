const WorkSubmission = require('../models/WorkSubmission');
const Task = require('../models/Task');
const TaskStatusHistory = require('../models/TaskStatusHistory');

const submitWork = async (req, res, next) => {
  try {
    const { taskId, description } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.'
      });
    }

    if (task.assignee.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only submit work for tasks assigned to you.'
      });
    }

    const submission = await WorkSubmission.create({
      task: taskId,
      employee: req.user._id,
      description: description.trim(),
      submittedAt: new Date(),
      reviewStatus: 'pending'
    });

    // Update task status to completed if it wasn't completed yet
    if (task.status !== 'completed' && task.status !== 'approved') {
      const oldStatus = task.status;
      task.status = 'completed';
      await task.save();

      await TaskStatusHistory.create({
        task: task._id,
        changedBy: req.user._id,
        fromStatus: oldStatus,
        toStatus: 'completed',
        changedAt: new Date()
      });
    }

    const populatedSubmission = await WorkSubmission.findById(submission._id)
      .populate('task', 'title description status')
      .populate('employee', 'name email');

    res.status(201).json({
      success: true,
      message: 'Work description submitted successfully for admin review.',
      submission: populatedSubmission
    });
  } catch (error) {
    next(error);
  }
};

const getWorkSubmissions = async (req, res, next) => {
  try {
    const { employee, task, reviewStatus, page = 1, limit = 10 } = req.query;
    const query = {};

    if (req.user.role === 'employee') {
      query.employee = req.user._id;
    } else if (employee) {
      query.employee = employee;
    }

    if (task) {
      query.task = task;
    }

    if (reviewStatus) {
      query.reviewStatus = reviewStatus;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await WorkSubmission.countDocuments(query);
    const submissions = await WorkSubmission.find(query)
      .populate('task', 'title description status dueDate')
      .populate('employee', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      submissions,
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

const reviewWorkSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewStatus, reviewRemark } = req.body;

    if (!['approved', 'rejected'].includes(reviewStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Review status must be either approved or rejected.'
      });
    }

    const submission = await WorkSubmission.findById(id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Work submission not found.'
      });
    }

    submission.reviewStatus = reviewStatus;
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();
    if (reviewRemark !== undefined) {
      submission.reviewRemark = reviewRemark.trim();
    }
    await submission.save();

    // Update corresponding task status
    const task = await Task.findById(submission.task);
    if (task) {
      const oldStatus = task.status;
      const newStatus = reviewStatus === 'approved' ? 'approved' : 'rejected';
      
      if (oldStatus !== newStatus) {
        task.status = newStatus;
        await task.save();

        await TaskStatusHistory.create({
          task: task._id,
          changedBy: req.user._id,
          fromStatus: oldStatus,
          toStatus: newStatus,
          changedAt: new Date()
        });
      }
    }

    const updatedSubmission = await WorkSubmission.findById(submission._id)
      .populate('task', 'title description status')
      .populate('employee', 'name email')
      .populate('reviewedBy', 'name email');

    res.json({
      success: true,
      message: `Work submission reviewed as ${reviewStatus}.`,
      submission: updatedSubmission
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitWork,
  getWorkSubmissions,
  reviewWorkSubmission
};

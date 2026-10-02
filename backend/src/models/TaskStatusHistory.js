const mongoose = require('mongoose');

const taskStatusHistorySchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Task reference is required']
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required']
    },
    fromStatus: {
      type: String,
      required: [true, 'From status is required']
    },
    toStatus: {
      type: String,
      required: [true, 'To status is required']
    },
    changedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

taskStatusHistorySchema.index({ task: 1, changedAt: -1 });
taskStatusHistorySchema.index({ changedBy: 1 });

module.exports = mongoose.model('TaskStatusHistory', taskStatusHistorySchema);

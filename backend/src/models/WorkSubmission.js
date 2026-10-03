const mongoose = require('mongoose');

const workSubmissionSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: false
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee reference is required']
    },
    description: {
      type: String,
      required: [true, 'Submission description is required'],
      trim: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    reviewStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    },
    reviewRemark: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: false
  }
);

workSubmissionSchema.index({ task: 1 });
workSubmissionSchema.index({ employee: 1, submittedAt: -1 });
workSubmissionSchema.index({ reviewStatus: 1 });

module.exports = mongoose.model('WorkSubmission', workSubmissionSchema);

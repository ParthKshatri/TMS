const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee reference is required']
    },
    date: {
      type: String,
      required: [true, 'Date string (YYYY-MM-DD) is required'],
      trim: true
    },
    loginTime: {
      type: Date,
      required: [true, 'Login time is required']
    },
    logoutTime: {
      type: Date
    },
    clockInStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved'
    },
    clockOutStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'approved'
    },
    clockInApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    clockInDecidedAt: {
      type: Date
    },
    clockInRejectionReason: {
      type: String,
      trim: true
    },
    clockOutApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    clockOutDecidedAt: {
      type: Date
    },
    clockOutRejectionReason: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: false
  }
);

// Enforce one attendance record per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: -1 });
attendanceSchema.index({ clockInStatus: 1 });
attendanceSchema.index({ clockOutStatus: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);

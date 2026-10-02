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
    }
  },
  {
    timestamps: false
  }
);

// Enforce one attendance record per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);

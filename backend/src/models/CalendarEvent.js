const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true
    },
    date: {
      type: String, // Format: YYYY-MM-DD for clean, timezone-agnostic date matching
      required: [true, 'Event date is required']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

calendarEventSchema.index({ date: 1 });

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);

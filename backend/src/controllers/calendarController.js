const CalendarEvent = require('../models/CalendarEvent');

const getEvents = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    let query = {};

    if (year && month) {
      const paddedMonth = String(month).padStart(2, '0');
      const prefix = `${year}-${paddedMonth}`;
      query.date = { $regex: `^${prefix}` };
    }

    const events = await CalendarEvent.find(query).sort({ date: 1, createdAt: 1 });

    res.json({
      success: true,
      events
    });
  } catch (error) {
    next(error);
  }
};

const addEvent = async (req, res, next) => {
  try {
    const { eventName, date } = req.body;

    if (!eventName || !eventName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Event name is required.'
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required.'
      });
    }

    const event = await CalendarEvent.create({
      eventName: eventName.trim(),
      date
    });

    res.status(201).json({
      success: true,
      message: 'Event added successfully.',
      event
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEvents,
  addEvent
};

const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const taskRoutes = require('./taskRoutes');
const workRoutes = require('./workRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const calendarRoutes = require('./calendarRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tasks', taskRoutes);
router.use('/work-submissions', workRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/calendar', calendarRoutes);

module.exports = router;

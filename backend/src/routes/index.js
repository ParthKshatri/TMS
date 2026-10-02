const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const taskRoutes = require('./taskRoutes');
const workRoutes = require('./workRoutes');
const attendanceRoutes = require('./attendanceRoutes');

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

module.exports = router;

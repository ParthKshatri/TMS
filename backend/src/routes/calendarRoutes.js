const express = require('express');
const calendarController = require('../controllers/calendarController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', calendarController.getEvents);
router.post('/', requireRole('admin'), calendarController.addEvent);

module.exports = router;

const express = require('express');
const { body } = require('express-validator');
const taskController = require('../controllers/taskController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.use(requireAuth);

router.get('/', taskController.getTasks);

router.post(
  '/',
  requireRole('admin'),
  [
    body('title').trim().notEmpty().withMessage('Task title is required.'),
    body('description').trim().notEmpty().withMessage('Task description is required.'),
    body('assignee').isMongoId().withMessage('Valid employee assignee ID is required.'),
    body('dueDate').optional({ checkFalsy: true }).isISO8601().withMessage('Valid due date is required.'),
    validate
  ],
  taskController.createTask
);

router.get('/:id', taskController.getTaskById);

router.patch(
  '/:id/status',
  [
    body('status')
      .isIn(['pending', 'in_progress', 'completed', 'approved', 'rejected'])
      .withMessage('Valid task status is required.'),
    validate
  ],
  taskController.updateTaskStatus
);

module.exports = router;

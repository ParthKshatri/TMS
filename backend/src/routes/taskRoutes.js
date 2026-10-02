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
    body('assignee')
      .optional()
      .isMongoId()
      .withMessage('Valid employee assignee ID is required.'),
    body('assignees')
      .optional()
      .isArray({ min: 1 })
      .withMessage('Assignees must be an array with at least one employee.')
      .custom((value) => {
        if (value && !value.every((id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id))) {
          throw new Error('All assignee IDs must be valid Mongo ObjectIds.');
        }
        return true;
      }),
    body().custom((reqBody) => {
      const hasAssignee = reqBody.assignee && typeof reqBody.assignee === 'string';
      const hasAssignees = Array.isArray(reqBody.assignees) && reqBody.assignees.length > 0;
      if (!hasAssignee && !hasAssignees) {
        throw new Error('Please select at least one employee assignee.');
      }
      return true;
    }),
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

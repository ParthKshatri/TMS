const express = require('express');
const { body } = require('express-validator');
const workController = require('../controllers/workController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.use(requireAuth);

router.get('/', workController.getWorkSubmissions);

router.post(
  '/',
  requireRole('employee'),
  [
    body('taskId').isMongoId().withMessage('Valid task ID is required.'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Work description is required.'),
    validate
  ],
  workController.submitWork
);

router.patch(
  '/:id/review',
  requireRole('admin'),
  [
    body('reviewStatus')
      .isIn(['approved', 'rejected'])
      .withMessage('Review status must be either approved or rejected.'),
    body('reviewRemark').optional().trim(),
    validate
  ],
  workController.reviewWorkSubmission
);

module.exports = router;

const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('admin'));

router.get('/', userController.getEmployees);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Full name is required.'),
    body('email').isEmail().withMessage('Valid email address is required.'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long.'),
    validate
  ],
  userController.createEmployee
);

router.get('/:id', userController.getUserDetails);

module.exports = router;

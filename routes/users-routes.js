const express = require('express');
const { check } = require('express-validator');

const usersControllers = require('../controllers/users-controllers');
const fileUpload = require('../middleware/file-upload');

const router = express.Router();

router.get('/', usersControllers.getUsers);

router.post('/signup',
  fileUpload.single('image'),
  [
    check('name').not().isEmpty(),
    check('password').isLength({ min: 5 }),
    check('email').normalizeEmail().isEmail(),
  ]
  , usersControllers.signup);

router.post('/login',
  [
    check('password').isLength({ min: 5 }),
    check('email').isEmail(),
  ],
  usersControllers.login);

module.exports = router;
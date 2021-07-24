const express = require('express');
const { check } = require('express-validator');

const usersControllers = require('../controllers/users-controllers');

const router = express.Router();

router.get('/', usersControllers.getUsers);

router.post('/signup',
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
const { validationResult } = require('express-validator');
const uuid = require('uuid');
const HttpError = require('../models/http-error');

const DUMMY_USERS = [
  {
    id: 'u1',
    name: 'Ibrahim AlRayyan',
    email: 'test@test.com',
    password: 'testing'
  },
  {
    id: 'u',
    name: 'Adam Joe',
    email: 'adam@joe.com',
    password: 'adamjoe'
  },
]

const getUsers = (req, res, next) => {
  res.json({ users: DUMMY_USERS });
};

const signup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("Invalid data passed to signup. Please check your data");
  };

  const { name, email, password } = req.body;
  const hasUser = DUMMY_USERS.find(u => u.email === email);
  if (hasUser) {
    throw new HttpError('Could not create user, email is already in use', 422);
  }
  const createdUser = {
    id: uuid.v4(),
    name,
    email,
    password
  };

  DUMMY_USERS.push(createdUser);

  res.status(201).json({ user: createdUser });
};

const login = (req, res, next) => {
  const { email, password } = req.body;

  const identifiedUser = DUMMY_USERS.find(u => u.email === email);
  console.log(req.body);
  console.log(identifiedUser);
  if (!identifiedUser || identifiedUser.password !== password) {
    throw new HttpError('Credentials seems to be invalid', 401);
  };

  res.json({ message: 'Logged in' });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
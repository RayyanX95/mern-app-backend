const { validationResult } = require('express-validator');
const uuid = require('uuid');

const HttpError = require('../models/http-error');
const User = require('../models/users');

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

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, '-password');
  } catch (error) {
    return next(new HttpError('Fetching users failed', 500));
  };

  res.json({ users: users.map(user => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid data passed to signup. Please check your data", 422));
  };

  const { name, email, password, places } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (error) {
    const err = new HttpError('Signing up failed', 500);
    return next(err);
  };
  if (existingUser) {
    return next(new Error('User exists already, please login instead', 422));
  }

  const createdUser = new User({
    name,
    email,
    password,
    image: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885__480.jpg',
    places
  })

  try {
    await createdUser.save();
  } catch (error) {
    return next(new Error('Signing up failed', 500));
  };

  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
};

const login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('errors', errors);
    return next(new HttpError('Could not login', 401));
  };

  const { email, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (error) {
    const err = new HttpError('logging in failed', 500);
    return next(err);
  };
  if (!existingUser || existingUser.password !== password) {
    return next(new Error('Credentials seems to be invalid', 401));
  }

  res.json({ message: 'Logged in' });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
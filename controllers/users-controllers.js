const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const User = require('../models/users');

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

  const { name, email, password } = req.body;
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
    image: req.file.path,
    places: []
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

  res.json({ message: 'Logged in!', user: existingUser.toObject({ getters: true }) });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
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

const getUsers = (req, res, next) => {
  res.json({ users: DUMMY_USERS });
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

const login = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError('Could not create user, email is already in use', 401);
  }
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
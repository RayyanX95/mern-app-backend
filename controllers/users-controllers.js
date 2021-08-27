const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const c;

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
  // npm i eslint prettier eslint-config-prettier eslint-plugin-prttier 
  /**
 * Hash the password before storing it in the database.
 */
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (error) {
    return next(new HttpError('Could NOT create user, please try again', 500));
  }

  const createdUser = new User({
    name,
    email,
    password: hashedPassword,
    image: req.file.path,
    places: []
  });

  let token
  try {
    /**
 * @function sign used to create a token
 * @param {Object | Buffer | string | ...} payload Could be an object literal, buffer or string representing valid JSON 
 * @param {Object | Buffer | string} secretOrPrivateKey containing either the secret for HMAC algorithms or the PEM encoded private RS and ECDSA.
 * @param {Object} [options] algorithm (default: HS256). expiresIn: expressed in seconds or a string describing a time span zeit/ms
 */
    token = jwt.sign(
      {
        userId: createdUser.id,
        email: createdUser.email
      },
      'supersecret_never_share_bud',
      { expiresIn: '1h' }
    );
  } catch (error) {
    return next(new HttpError('Signing up failed, could not create token', 500));
  };

  try {
    await createdUser.save();
  } catch (error) {
    return next(new Error('Signing up failed', 500));
  };

  res.status(201).json({
    userId: createdUser.id,
    email: createdUser.email,
    name: createdUser.name,
    token
  });
}

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
  if (!existingUser) {
    return next(new Error('Credentials seems to be invalid', 401));
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (error) {
    return next(new HttpError('Could not login, please try again later', 500));
  };

  if (!isValidPassword) {
    return next(new Error('Credentials seems to be invalid', 401));
  };

  let token
  try {
    /**
 * @function sign used to create a token
 * @param {Object | Buffer | string | ...} payload Could be an object literal, buffer or string representing valid JSON 
 * @param {Object | Buffer | string} secretOrPrivateKey containing either the secret for HMAC algorithms or the PEM encoded private RS and ECDSA.
 * @param {Object} [options] algorithm (default: HS256). expiresIn: expressed in seconds or a string describing a time span zeit/ms
 */
    token = jwt.sign(
      {
        userId: existingUser.id,
        email: existingUser.email
      },
      'supersecret_never_share_bud',
      { expiresIn: '1h' }
    );
  } catch (error) {
    return next(new Error('Logging in failed', 500));
  };

  res.status(201).json({
    userId: existingUser.id,
    email: existingUser.email,
    name: existingUser.name,
    token
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
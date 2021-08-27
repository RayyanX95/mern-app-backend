const HttpError = require('../models/http-error');
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // if the http method is OPTIONS forward the request without for a TOKEN
  // This adjustment is necessary to unblock OPTIONS request
  if (req.method === 'OPTIONS') {
    return next();
  }

  try {
    const token = req.headers.authorization.split(' ')[1]; // Authorization: 'Bearer TOKEN'
    if (!token) {
      return next(new HttpError('Authorization failed: ', 401));
    }

    /**
     * @function verify decode a token using @secretOrPublicKey that was used to encrypt the token 
     * @param {string} token s the JsonWebToken string
     * @param {String} secretOrPublicKey
     */
    const decodedToken = jwt.verify(token, 'supersecret_never_share_bud');
    req.userData = { userId: decodedToken.userId };
    // const { userId } = jwt.verify(token, 'supersecret_never_share_bud');
    // req.userData = { userId };

    next(); // move on to the next middleware
  } catch (error) {
    return next(new HttpError('Authorization failed. ', 401));
  }
};
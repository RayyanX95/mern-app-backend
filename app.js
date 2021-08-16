const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');

const HttpError = require('./models/http-error');
const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./routes/users-routes');

const app = express();

// This will parse all incoming request body and extract any json data
// and convert them into regular javascript data structures
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Request-With, Content-Type, Accept, Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

  next();
})

app.use('/api/places', placesRoutes);

app.use('/api/users', usersRoutes);

app.use((req, res, next) => {
  const error = new HttpError('Could not find this route.', 404);
  throw error;
})

app.use((err, req, res, next) => {
  /**
   * @file property is provided by @multer package
   * @unlink is a @fs method that take a file path and remove this file
   */
  if (req.file) {
    fs.unlink(req.file.path, err => {
      //* this callback is called after removed OR an error occurs
      console.log(err);
    });
  };
  
  if (res.headerSent) {
    return next(err);
  }
  res.status(err.code || 500);
  res.json({ message: err.message || "Unknown error occurred!" })
});

mongoose.connect('mongodb+srv://mern-course:mern-course@cluster0.ujphw.mongodb.net/mern?retryWrites=true&w=majority').then(() => {
  app.listen(5000);
}).catch((err) => {
  console.log(err);
});
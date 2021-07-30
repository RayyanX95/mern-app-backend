const express = require('express');
const mongoose = require('mongoose');

const HttpError = require('./models/http-error');
const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./routes/users-routes');

const app = express();

// This will parse all incoming request body and extract any json data
// and convert them into regular javascript data structures
app.use(express.json());

app.use('/api/places', placesRoutes);

app.use('/api/users', usersRoutes);

app.use((req, res, next) => {
  const error = new HttpError('Could not find this route.', 404);
  throw error;
})

app.use((err, req, res, next) => {
  if (res.headerSent) {
    return next(err);
  }
  res.status(err.code || 500);
  res.json({ message: err.message || "Unknown error occurred!" })
});

mongoose.connect('mongodb+srv://shareplaces:shareplaces@cluster0.2tys1.mongodb.net/places?retryWrites=true&w=majority').then(() => {
  app.listen(5000);
}).catch((err) => {
  console.log(err);
})
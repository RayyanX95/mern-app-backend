const express = require('express');

const placesRoutes = require('./routes/places-routes');

const app = express();

// This will parse all incoming request body and extract any json data
// and convert them into regular javascript data structures
app.use(express.json());

app.use('/api/places', placesRoutes);

app.use((err, req, res, next) => {
  if (res.headerSent) {
    return next(err);
  }
  res.status(err.code || 500);
  res.json({ message: err.message || "Unknown error occurred!" })
});

app.listen(5000);
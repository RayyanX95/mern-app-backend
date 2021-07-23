const uuid = require('uuid');

const HttpError = require("../models/http-error");

const DUMMY_PLACES = [
  {
    id: 'p1',
    title: 'Empire State',
    description: 'One of the famous sky scrapers in the world',
    location: {
      lat: 40.7484474,
      lng: -73.9871516
    },
    address: '20 w 34th st, New York',
    creator: 'u1',
  }
]

const getPlaceById = (req, res, next) => {
  const placeId = req.params.pid;
  const place = DUMMY_PLACES.find(p => p.id === placeId);
  if (!place) {
    throw new HttpError('Could not find place with place id ' + placeId, 404);
  }
  res.json({ place });
};

const getPlaceByUserId = (req, res, next) => {
  const userId = req.params.uid;
  console.log(userId);
  const place = DUMMY_PLACES.find(p => p.creator === userId);
  if (!place) {
    return next(new Error('Could not find place with user id ' + userId, 404));
  }
  res.json({ place });
};

const createPlace = (req, res, next) => {
  const { title, description, address, coordinates, creator } = req.body;

  const createdPlace = {
    id: uuid.v4(),
    title,
    description,
    location: coordinates,
    address,
    creator,
  };

  DUMMY_PLACES.push(createdPlace);

  // 201 default status when something successfully created on the server
  res.status(201).json({ place: createdPlace });
}

exports.getPlaceById = getPlaceById;
exports.getPlaceByUserId = getPlaceByUserId;
exports.createPlace = createPlace;
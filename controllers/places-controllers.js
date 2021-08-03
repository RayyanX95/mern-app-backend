const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const uuid = require('uuid');

const HttpError = require("../models/http-error");
const getCoordinatesForAddress = require('../util/location');
const Place = require('../models/place');
const User = require('../models/users');

let DUMMY_PLACES = [
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

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    /** 
     * @findById is a static method and id does NOT return a promise and we can make 
     * * it return a promise bu using chain exec() to it => findById().exec();
     * @return an instance of the Schema constructor
     * */
    place = await Place.findById(placeId);
  } catch (error) {
    return next(new HttpError('Could not find the place', 500))
  };
  if (!place) {
    throw new HttpError('Could not find place with place id ' + placeId, 404);
  }
  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let places;
  /**
   * @find methods return array and do NOT return Promise just like `findById()` method.
   * @Place is the mongoose Schema constructor function
   */
  try {
    places = await Place.find({ creator: userId });
  } catch (error) {
    return next(new Error('Could not find place ', 500));
  };
  if (!places || places.length === 0) {
    return next(new Error('Could not find place with user id ' + userId, 404));
  }
  res.json({ places: places.map(p => p.toObject({ getters: true })) });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors)
    return next(new HttpError('Invalid inputs passed, please check your data.', 422));
  }
  const { title, description, address, creator } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordinatesForAddress(address);
  } catch (err) {
    return next(err);
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: "https://img.yts.mx/assets/images/movies/jungle_cruise_2021/medium-cover.jpg",
    creator
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (error) {
    const err = new HttpError('Creating place failed, please again.', 500);
    next(err);
  };

  if (!user) {
    return next(new HttpError('Could not find user with id ' + creator, 404));
  }

  console.log(user);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    /** 
     * @save is an instance method of the Schema constructor and it's executed async
     * */
    await createdPlace.save({ session: sess });
    /**
     * @push is an mongoose method that behinds the scenes grasp the createdPlace Id
     * and it to places field of the user (id adds only the place id)
     */
    user.places.push(createdPlace);
    await user.save({ session: sess });
    sess.commitTransaction();
  } catch (error) {
    const err = new HttpError('Creating place failed, please again.', 500);
    // We have to use next here because it's async code!!
    next(err);
  };

  // 201 default status when something successfully created on the server
  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors)
    throw new HttpError('Invalid inputs passed, please check your data.', 422);
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;
  let place;
  try {
    /** 
 * @findById is a static method and id does NOT return a promise and we can make 
 * * it return a promise bu using chain exec() to it => findById().exec();
 * @return an instance of the Schema constructor
 * */
    place = await Place.findById(placeId);
  } catch (error) {
    return next(new HttpError('Could not find the place', 500))
  };

  if (!place) {
    throw new HttpError('Could not find place with place id ' + placeId, 404);
  }

  place.title = title;
  place.description = description;
  try {
    /**
     * @save is instance method so it's being called using an instance of the Schema(Place)
     */
    await place.save();
  } catch (error) {
    const err = new HttpError('Updating place failed, please try again.', 500);
    // We have to use next here because it's async code!!
    return next(err);
  };

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (error) {
    const err = new HttpError('Something went wrong while deleting place failed, please try again.', 500);
    // We have to use next here because it's async code!!
    return next(err);
  };

  try {
    /**
     * @remove is an instance method of the Schema constructor and it's executed async
     */
    await place.remove();
  } catch (error) {
    const err = new HttpError('Deleting place failed, please try again.', 500);
    // We have to use next here because it's async code!!
    return next(err);
  };

  res.status(200).json({ message: 'Place deleted!' });
}

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.deletePlace = deletePlace;
exports.updatePlace = updatePlace;
const fs = require('fs');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const getCoordinatesForAddress = require('../util/location');
const Place = require('../models/place');
const User = require('../models/users');

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
    return next(new HttpError('Could not find the place', 500));
  }
  if (!place) {
    throw new HttpError(`Could not find place with place id ${  placeId}`, 404);
  }
  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  // ** used with the alternative approach of @populate() method
  let userWithPlaces;
  try {
    /**
     * @find methods return array and do NOT return Promise just like `findById()` method.
     * @Place is the mongoose Schema constructor function
     */
    // places = await Place.find({ creator: userId });

    /**
     * Alternative approach to get places of a certain user using @populate method
     * We use @places property of @User model as the ref (relation)
     */
    userWithPlaces = await User.findById(userId).populate('places');
  } catch (error) {
    return next(new Error('Could not find place ', 500));
  }
  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    // if (!places || places.length === 0) {
    return next(new Error(`Could not find place with user id ${  userId}`, 404));
  }
  res.json({ places: userWithPlaces.places.map(p => p.toObject({ getters: true })) });
  // res.json({ places: places.map(p => p.toObject({ getters: true })) });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError('Invalid inputs passed, please check your data.', 422));
  }
  const { title, description, address } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordinatesForAddress(address);
  } catch (err) {
    return next(err);
  }

  const creator = req.userData.userId;
  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (error) {
    const err = new HttpError('Creating place failed, please try again.', 500);
    next(err);
  }

  if (!user) {
    return next(new HttpError(`Could not find user with id ${  creator}`, 404));
  }


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
  }

  // 201 default status when something successfully created on the server
  console.log('EOF');
  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError('Invalid inputs passed, please check your data.', 422);
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;
  let place;
  try {
    /** 
     * @findById is a static method and id does NOT return a promise and we can make 
     * @returns {promise} by using chain exec() to it => findById().exec();
     * @return an instance of the Schema constructor
     * */
    place = await Place.findById(placeId);
  } catch (error) {
    return next(new HttpError('Could not find the place', 500));
  }

  /**
   * Check if the @userId who sent the request is the user who created the place.
   * We have to use @toString method here converts mongoose object type to string.
   */
  if (place.creator.toString() !== req.userData.userId) {
    return next(new HttpError('You are not allowed to update this place.', 401));
  }

  if (!place) {
    throw new HttpError(`Could not find place with place id ${  placeId}`, 404);
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
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId).populate('creator');
  } catch (error) {
    const err = new HttpError('Something went wrong while deleting place failed, please try again.', 500);
    // We have to use next here because it's async code!!
    return next(err);
  }

  /**
   * Check if the @userId who sent the request is the user who created the place.
   */
  if (place.creator.id !== req.userData.userId) {
    return next(new HttpError('You are not allowed to update this place.', 401));
  }

  if (!place) {
    return next(new HttpError(`Could not find place with id ${  place}`, 404));
  }

  const imagePath = place.image;
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    /**
     * @remove is an instance method of the Schema constructor and it's executed async
     */
    await place.remove({ session: sess });
    /**
     * @pull is a method only remove the Id of this place from @places array
     * Thanks to @populate method now we can access the user info that has same Id of 
     * the place @creator property directly from the place
     */
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (error) {
    const err = new HttpError('Deleting place failed, please try again.', 500);
    // We have to use next here because it's async code!!
    return next(err);
  }

  fs.unlink(imagePath, err => {
    console.log(err);
  });

  res.status(200).json({ message: 'Place deleted!' });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.deletePlace = deletePlace;
exports.updatePlace = updatePlace;
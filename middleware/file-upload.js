const multer = require('multer');
const uuid = require('uuid');

const MIME_TYPE_MAP = {
  'image/png': 'png',
  'image/jpg': 'jpg',
  'image/jpeg': 'jpeg',
};

/**
 * @fileUpload is an object that a bunch of middleware
 */
const fileUpload = multer({
  limits: 500000,
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      //* specify the location to store files (images in this case)
      cb(null, 'uploads/images');

    },
    filename: (req, file, cb) => {
      //* Extract the image extension using the MIME_TYPE_MAP helper object
      const ext = MIME_TYPE_MAP[file.mimetype];
      //* generate a random file with the right extension
      cb(null, `${uuid.v1()  }.${  ext}`);
    }
  }),
  //* 
  fileFilter: (req, file, cb) => {
    //* Check if the incoming file has the right extension
    const isValid = !!MIME_TYPE_MAP[file.mimetype];
    //* Generate an error message if the file has invalid extension
    const error = isValid ? null : new Error(`Invalid mime type: ${  file.mimetype}`);
    //* invoke the callback
    cb(error, isValid);
  }
});

module.exports = fileUpload;
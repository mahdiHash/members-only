const os = require('os');
const fs = require('fs');
const path = require('path');
const { 
  S3Client, 
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (req, file, cb) => {
    let name = Date.now() + path.extname(file.originalname);
    cb(null, name);
  }
});

const saveImage = multer({
  storage: storage,
  limits: {
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    let allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];

    if (!allowedExtensions.includes(path.extname(file.originalname).toLowerCase())) {
      let err = new Error('File extension is not valid. Only .jpg, .jpeg, .png, and .gif are accepted')
      return cb(err, false);
    }

    cb(null, true);
  }
}).single('userAvatar');

const s3 = new S3Client({
  region: 'default',
  endpoint: process.env.ENDPOINT,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
  }
});

const controllers = {};

require('dotenv').config();

// GET image request
controllers.getImage = (req, res, next) => {
  let dir = `${os.tmpdir}/${Date.now() + path.extname(req.params.imgName)}`;
  let tempStream = fs.createWriteStream(dir);

  req.on('close', () => {
    tempStream.close((err) => {
      if (err) next(err);
    });
    fs.rm(dir, (err) => {
      if (err) next(err);
    });
  });

  tempStream.on('finish', () => {
    res.sendFile(dir);
  });

  s3.send(new GetObjectCommand({
    Bucket: process.env.BUCKET,
    Key: req.params.imgName,
  }))
    .then((data) => {
      data.Body.pipe(tempStream);
    })
    .catch(next);
}

controllers.saveImgLocally = (req, res, next) => {
  saveImage(req, res, (error) => {
    next(error, req, res);
  });
};

controllers.uploadImg = (localPath, cloudImgName) => {
  let uploadParams = {
    Bucket: process.env.BUCKET,
    Key: cloudImgName,
    ACL: 'public-read',
    Body: fs.createReadStream(localPath),
  };

  return s3.send(new PutObjectCommand(uploadParams));
}

controllers.deleteImg = (cloudImgName) => {
  let params = {
    Bucket: process.env.BUCKET,
    Key: cloudImgName,
  };

  return s3.send(new DeleteObjectCommand(params));
}

module.exports = controllers;

const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/user');
const imgControllers = require('./imgController');
const fs = require('fs');
const controllers = {}
const { RegisterFailure, ServerErr } = require('../lib/errors');
const path = require('path');

// config passport 
require('../config/passportConfig');

controllers.userSignupPOST = [
  imgControllers.saveImgLocally,

  (error, req, res, next) => {
    if (error) {
      req.fileErrs = error;
    }
    next();
  },

  body('firstname', 'First name must contain at least 1 alphabetical character')
    .trim().isLength({ min: 1 }).isAlpha(),
  body('lastname', 'Last name must contain at least 1 alphabetical character')
    .trim().isLength({ min: 1 }).isAlpha(),
  body('username', 'Username must contain at least 3 numeric or alphabetical characters')
    .trim().isLength({ min: 3 }).isAlphanumeric(),
  body('password', 'Password must contain at least 6 characters').trim().isLength({ min: 6 }),
  body('passConfirmVal', 'The passwords you entered are not the same.').trim()
    .custom((value, { req }) => {
      return value.trim() === req.body.password.trim();
    }),
  body('userAvatar', 'File too large. Max size: 500KB.')
    .custom((value, { req }) => {
      return req.file ? req.file.size <= 500000 : true;
    }),

  (req, res, next) => {
    let errors = validationResult(req).array();

    // search for similar username in the db
    new Promise((resolve, reject) => {
      User.findOne({ username: req.body.username.trim().toLowerCase() })
        .exec((err, user) => {
          if (err) {
            if (req.file) {
              fs.rm(req.file.path, (err) => {
                if (err) {
                  let error = new ServerErr(err.message);
                  next(error);
                }
              });
            }
            let error = new ServerErr(err.message);
            reject(error);
          }
          else {
            resolve(user);
          }
        });
    })
      .then((user) => {
        if (user) {
          let err = new RegisterFailure('Username is already taken. Choose another.');
          errors.push(err);
        }

        // if there's any error, delete the image and show the form again
        if (errors.length) {
          if (req.file) {
            fs.rm(req.file.path, (err) => {
              if (err) {
                let error = new ServerErr(err.message);
                next(error);
              }
            });
          }
          res.render('signup', {
            title: 'Sign Up',
            errors: errors.concat(req.fileErrs ?? []),
            inputs: {
              firstname: req.body.firstname,
              lastname: req.body.lastname,
              username: req.body.username,
            }
          });
        }
        else {
          bcrypt.hash(req.body.password, 16, (err, hashedPass) => {
            if (err) {
              let error = new ServerErr(err.message);
              return next(error);
            }

            let user = new User({
              firstname: req.body.firstname,
              lastname: req.body.lastname,
              username: req.body.username.toLowerCase(),
              password: hashedPass,
              premium: false,
              is_admin: false,
              avatarURL: null,
            });

            // if there's a file, upload it to cloud storage
            // and then store the user information in db
            new Promise((resolve, reject) => {
              if (req.file) {
                let cloudImgName = `membersOnly${user._id}${path.extname(req.file.originalname)}`;
                imgControllers.uploadImg(req.file.path, cloudImgName)
                  .then(() => {
                    user.avatarURL = cloudImgName;
                    fs.rm(req.file.path, (err) => {
                      if (err) {
                        let error = new ServerErr(err.message);
                        next(error);
                      }
                    });
                  })
                  .catch((err) => {
                    let error = new ServerErr(err.message ?? err.msg);
                    reject(error);
                  });
              }
              resolve();
            })
              .finally(() => {
                user.save((err) => {
                  if (err) {
                    let error = new ServerErr(err.message ?? err.msg);
                    return next(error);
                  }
                });
                res.redirect('/users/login');
              })
              .catch(next);
          });
        }
      })
      .catch(next);
  }
];

controllers.userLoginPOST = [
  passport.authenticate('local'),

  (req, res, next) => {
    if (req.session?.passport?.user) {
      res.redirect('/');
    }
    else {
      res.render('login', {
        title: 'Log In',
        err: new ServerErr('Something went wrong in authentication process.'),
      });
    }
  }
];

// GET user profile
controllers.userProfileGET = (req, res, next) => {
  new Promise((resolve, reject) => {
    User.findOne({ username: req.params.username.toLowerCase() })
      .exec((err, user) => {
        if (err) {
          let error = new ServerErr(err.message);
          reject(error);
        }

        if (user) {
          resolve(user);
        }
        else {
          reject()
        }
      })
  })
    .then((user) => {
      res.render('user-profile', {
        title: user.fullname + '\'s Profile',
        targetUser: user,
      });
    })
    .catch(next);
}

controllers.userProfileEditGET = (req, res, next) => {
  if (!req.session?.passport?.user) {
    res.redirect('/users/login');
    return;
  }

  new Promise((resolve, reject) => {
    User.findOne({ username: req.user.username })
      .exec((err, user) => {
        if (err) {
          let error = new ServerErr(err.message);
          reject(error);
        }

        if (user) {
          resolve(user);
        }
        else {
          reject(null);
        }
      })
  })
    .then((user) => {
      res.render('edit-profile', {
        title: 'Edit Profile',
        avatarURL: user.avatarURL,
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.username,
      });
    })
    .catch((err) => {
      if (err) {
        next(error);
      }

      if (err === null) {
        res.redirect('/users/login');
      }
    });
}

controllers.userProfileEditPOST = [
  // check whether ther is a user logged in or not
  (req, res, next) => {
    if (!req.session?.passport?.user) {
      res.redirect('/users/login');
      return;
    }
    next();
  },

  imgControllers.saveImgLocally,

  (errors, req, res, next) => {
    if (errors) {
      req.fileErrs = errors;
    }
    next();
  },

  // validation
  body('firstname', 'First name must contain at least 1 alphabetical character')
    .trim().isLength({ min: 1 }).isAlpha(),
  body('lastname', 'Last name must contain at least 1 alphabetical character')
    .trim().isLength({ min: 1 }).isAlpha(),
  body('username', 'Username must contain at least 3 numeric or alphabetical characters')
    .trim().isLength({ min: 3 }).isAlphanumeric(),
  body('userAvatar', 'File too large. Max size: 500KB.')
    .custom((value, { req }) => {
      return req.file ? req.file.size <= 500000 : true;
    }),

  (req, res, next) => {
    let errors = validationResult(req).array();

    // search for similar username in the db
    new Promise((resolve, reject) => {
      if (req.user.username === req.body.username.toLowerCase()) {
        resolve(null);
      }
      else {
        User.findOne({ username: req.body.username.toLowerCase() })
          .exec((err, user) => {
            if (err) {
              if (req.file) {
                fs.rm(req.file.path, (err) => {
                  if (err) {
                    let error = new ServerErr(err.message);
                    reject(error);
                  }
                });
              }
              let error = new ServerErr(err.message);
              reject(error);
            }
            else {
              resolve(user);
            }
          });
      }
    })
      .then((user) => {
        if (user) {
          let err = new RegisterFailure('Username is already taken. Choose another.');
          errors.push(err);
        }

        // if there's any error, delete the image and show the form again
        if (errors.length) {
          if (req.file) {
            fs.rm(req.file.path, (err) => {
              if (err) {
                let error = new ServerErr(err.message);
                next(error);
              }
            });
          }
          res.render('edit-profile', {
            title: 'Edit Profile',
            errors: errors.concat(req.fileErrs ?? []),
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            username: req.body.username.toLowerCase(),
          });
        }
        else {
          let edittedUser = new User({
            _id: req.user._id,
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            username: req.body.username.toLowerCase(),
            avatarURL: req.user.avatarURL,
          });

          new Promise((resolve, reject) => {
            if (req.file) {
              // if there's already an avatar for user, delete it
              if (req.user.avatarURL) {
                imgControllers.deleteImg(req.user.avatarURL);
              }

              // upload the user's new avatar
              let cloudImgName = `membersOnly${edittedUser._id}${path.extname(req.file.originalname)}`;
              imgControllers.uploadImg(
                req.file.path,
                cloudImgName
              )
                .then(() => {
                  edittedUser.avatarURL = cloudImgName;
                  fs.rm(req.file.path, (err) => {
                    if (err) {
                      let error = new ServerErr(err.message);
                      next(error);
                    }
                  });
                  resolve();
                })
                .catch((err) => {
                  reject(err);
                });
            }
            else {
              resolve();
            }
          })
            .finally(() => {
              User.findByIdAndUpdate(req.user._id, edittedUser)
                .exec((err, user) => {
                  if (err) {
                    let error = new ServerErr(err.message);
                    throw error;
                  }

                  res.redirect(`/users/${edittedUser.username}`);
                });
            });
        }
      })
      .catch(next);
  }
];

controllers.becomePremiumGET = (req, res, next) => {
  if (!req.session?.passport?.user) {
    res.redirect('/users/login');
  }
  else {
    res.render('become-premium', {
      title: 'Become Premium',
    });
  }
}

controllers.becomePremiumPOST = (req, res, next) => {
  if (!req.session?.passport?.user) {
    res.redirect('/users/login');
  }
  else {
    require('dotenv').config();

    let premiumCodes = process.env.PREMIUM_CODES.split(';');

    if (premiumCodes.includes(req.body.code.toLowerCase())) {
      let updateUser = new User({
        premium: true,
        _id: req.user._id,
      });

      User.findByIdAndUpdate(req.user._id, updateUser)
        .exec((err, user) => {
          if (err) {
            let error = new ServerErr(err.message);
            next(error);
          }
          else {
            res.redirect('/users/' + req.user.username);
          }
        });
    }
    else {
      res.render('become-premium', {
        title: 'Become Premium',
        err: new Error('Code is not valid. Please try another.'),
      });
    }
  }
}

controllers.resetPassGET = (req, res, next) => {
  if (!req.session?.passport?.user) {
    res.redirect('/users/login');
  }
  else {
    res.render('reset-pass', {
      title: 'Reset Your Password',
    });
  }
}

controllers.resetPassPOST = [
  (req, res, next) => {
    if (!req.session?.passport?.user) {
      res.redirect('/users/login');
      return;
    }
    next();
  },

  // validation
  body('oldPass', 'Your old password is not correct. Please try again').trim()
    .custom(async (oldPass, { req }) => {
      let isValid;

      // wrapped the user pass validation process inside a Promise so 
      // the app could wait until it's settled
      await new Promise((resolve, reject) => {
        User.findById(req.user._id)
          .exec(async (err, user) => {
            if (err) {
              let error = new ServerErr(err.message);
              reject(error);
            }
            else {
              isValid = await bcrypt.compare(oldPass.trim(), user.password);
              resolve();
            }
          })
      })
        .catch((err) => {
          let error = new ServerErr(err.message ?? err.msg)
          throw error;
        });

      return isValid;
    }),
  body('newPass', 'New password must contain at least 6 characters').trim()
    .isLength({ min: 6 }),
  body('newPassConfVal', 'The passwords you entered are not the same').trim()
    .custom((passConfVal, { req }) => {
      return passConfVal.trim() === req.body.newPass.trim();
    }),

  (req, res, next) => {
    let errors = validationResult(req).array();

    if (errors.length) {
      res.render('reset-pass', {
        title: 'Reset Your Password',
        errors: errors,
      });
      return;
    }

    bcrypt.hash(req.body.newPass.trim(), 16, (err, hashedPass) => {
      if (err) {
        let error = new ServerErr(err.message);
        return next(error);
      }

      let userUpdate = new User({
        password: hashedPass,
        _id: req.user._id,
      });

      User.findByIdAndUpdate(userUpdate._id, userUpdate)
        .exec((err, user) => {
          if (err) {
            let error = new ServerErr(err.message);
            return next(error);
          }

          res.render('reset-pass', {
            title: 'Success!',
            isDone: true,
          });
        });
    });
  }
];

module.exports = controllers;

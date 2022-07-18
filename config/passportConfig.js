const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { LoginFailure } = require('../lib/errors');

const strategy = new LocalStrategy(
  (username, password, cb) => {
    User.findOne({ username: username })
      .exec((err, user) => {
        if (err) {
          return cb(err);
        }

        // username not found
        if (!user) {
          let error = new LoginFailure('Username or password is wrong.');
          return cb(error, false);
        }

        new Promise((resolve, reject) => {
          bcrypt.compare(password, user.password, (err, isValid) => {
            if (err) {
              return reject(err);
            }

            // username is found and password is correct
            if (isValid) {
              resolve(user);
            }
            // username is found but password is not correct
            else {
              let error = new LoginFailure('Username or password is wrong.');
              reject(error);
            }
          });
        })
          .then((user) => {
            cb(null, user);
          })
          .catch(cb);
      });
  }
);

passport.use(strategy);

passport.serializeUser((user, cb) => {
  cb(null, user.id);
});

passport.deserializeUser((id, cb) => {
  User.findById(id)
    .exec((err, user) => {
      if (err) {
        return cb(err);
      }

      cb(null, user);
    })
});

module.exports = passport;

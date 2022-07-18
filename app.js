const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const mongoose = require('mongoose');
const {
  Unauthorized,
  LoginFailure,
  RegisterFailure,
  ServerErr,
} = require('./lib/errors');

require('dotenv').config();

const mongodbURI = process.env.MONGODB_URI;
mongoose.connect(mongodbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const sessionStore = MongoStore.create({
  mongoUrl: mongodbURI,
  collection: 'sessions',
});

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const imgRouter = require('./routes/img');
const messageRouter = require('./routes/message');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// session setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: sessionStore,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 3, // 3 days
  }
}));

// passport setup
require('./config/passportConfig');
app.use(passport.initialize());
app.use(passport.session());

// make logged in user object accessible throughout the app
app.use((req, res, next) => {
  if (req.user) {
    res.locals.user = req.user;
  }
  next();
});

app.use('/img', imgRouter);
app.use('/users', usersRouter);
app.use('/message', messageRouter);
app.use('/', indexRouter);

// error handler
app.use((err, req, res, next) => {
  if (err instanceof Unauthorized) {
    res.render('login', {
      title: 'Log In',
      err: err,
    });
  }
  else if (err instanceof LoginFailure) {
    res.render('login', {
      title: 'Log In',
      err: err,
    });
  }
  else if (err instanceof RegisterFailure) {
    res.render('signup', {
      title: 'Sign Up', 
      errors: err,
    });
  }
  else if (err instanceof ServerErr) {
    console.log('\x1b[31m%s\x1b[0m', '*** Server-side Error ***\n', req.originalUrl, '\n', err.stack);
    res.render('server-err', {
      title: 'Sorry for disturbance',
      error: err,
    });
  }
  else {
    // log the uncaught error
    console.log('\x1b[31m%s\x1b[0m', '!!!!!! Uncaught Error !!!!!!\n', req.originalUrl, '\n', err.stack);

    // 404 error
    next();
  }
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.render('error404', {
    title: 'Not found',
  });
});

module.exports = app;

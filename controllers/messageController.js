const { body, validationResult } = require('express-validator');
const Message = require('../models/message');
const controllers = {};
const { ServerErr } = require('../lib/errors');
const { decode } = require('../lib/unescape');

// GET create message 
controllers.createMessageGET = (req, res, next) => {
  if (req.session?.passport?.user) {
    res.render('create-message', {
      title: 'Create Message',
    })
  }
  else {
    res.redirect('/users/login');
  }
}

// POST create message
controllers.createMessagePOST = [
  (req, res, next) => {
    if (!req.session?.passport?.user) {
      res.redirect('/users/login');
    }
    else {
      next();
    }
  },

  // validation and sanitization
  body('title', 'The title should not be empty').trim()
    .isLength({ min: 1 }).escape(),
  body('text', 'The message should not be empty').trim()
    .isLength({ min: 1 }).escape(),

  (req, res, next) => {
    let error = validationResult(req);

    if (!error.isEmpty()) {
      res.render('create-message', {
        title: 'Create Message',
        err: error.array()[0],
      })
    }
    else {
      let msg = new Message({
        title: req.body.title,
        time: new Date(),
        text: req.body.text,
        creator: req.user._id,
        is_pinned: false,
      });

      msg.save((err) => {
        if (err) {
          let error = new ServerErr(err.message ?? err.msg);
          return next(error);
        }

        res.redirect('/');
      })
    }
  }
];

controllers.getAllMessages = (req, res, next) => {
  let pinnedMsgs = new Promise((resolve, reject) => {
    Message.find({ is_pinned: true })
      // sort by date: new
      .sort({ time: -1 })
      .populate('creator')
      .exec((err, messages) => {
        if (err) {
          let error = new ServerErr(err.message);
          reject(error);
        }

        resolve(messages);
      });
  })

  let nonPinnedMsgs = new Promise((resolve, reject) => {
    Message.find({ is_pinned: false })
      // sort by date: new
      .sort({ time: -1 })
      .populate('creator')
      .exec((err, messages) => {
        if (err) {
          let error = new ServerErr(err.message);
          reject(error);
        }

        resolve(messages);
      });
  })

  Promise.all([pinnedMsgs, nonPinnedMsgs])
    .then((msgs) => {
      let [pinned, nonPinned] = msgs;

      // unescape the title and text of all messages
      for (let msg of [...pinned, ...nonPinned]) {
        msg.title = decode(msg.title);
        msg.text = decode(msg.text);
      }

      res.render('index', {
        title: 'Pizza Discuss',
        pinnedMsgs: pinned,
        nonPinnedMsgs: nonPinned,
      });
    })
    .catch((err) => {
      next(err);
    });
}

controllers.editMessageGET = (req, res, next) => {
  Message.findById(req.params.msgId)
    .populate('creator')
    .exec((err, msg) => {
      if (err) {
        let error = new ServerErr(err.message);
        return next(error);
      }

      if (!msg) {
        return res.redirect('/');
      }

      if (
        // compare the logged in user id with message's creator id
        req.session?.passport?.user === msg.creator._id.toString()
        || req.user.is_admin
      ) {
        // decode escaped characters
        msg.title = decode(msg.title);
        msg.text = decode(msg.text);

        res.render('create-message', {
          title: 'Edit Message',
          message: msg,
        });
      }
      else {
        res.redirect('/');
      }
    });
}

controllers.editMessagePOST = [
  (req, res, next) => {
    if (!req.session?.passport?.user) {
      return res.redirect('/users/login');
    }
    
    Message.findById(req.params.msgId) 
      .populate('creator')
      .exec((err, msg) => {
        if (err) {
          let error = new ServerErr(err.message);
          return next(error);
        }

        if (!msg) {
          return res.redirect('/');
        }

        if (
          // compare the logged in user id with message's creator id
          req.session?.passport?.user !== msg.creator._id.toString()
          && !req.user.is_admin
        ) {
          res.redirect('/');
        }
        else {
          res.locals.message = msg;
          next();
        }
      })
  },

  // validation and sanitization
  body('title', 'The title should not be empty').trim()
    .isLength({ min: 1 }).escape(),
  body('text', 'The message text should not be empty').trim()
    .isLength({ min: 1 }).escape(),

  (req, res, next) => {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.render('create-message', {
        title: 'Create Message',
        message: res.locals.message,
        errors: errors.array(),
      })
    }
    else {
      let msg = new Message({
        title: req.body.title,
        text: req.body.text,
        time: res.locals.message.time,
        _id: req.params.msgId,
      });

      Message.findByIdAndUpdate(req.params.msgId, msg)
        .exec((err, msg) => {
          if (err) {
            let error = new ServerErr(err.message);
            return next(error);
          }

          res.redirect('/');
        });
    }
  }
];

controllers.deleteMessagePOST = (req, res, next) => {
  Message.findById(req.params.msgId)
    .populate('creator')
    .exec((err, msg) => {
      if (err) {
        let error = new ServerErr(err.message);
        return next(error);
      }

      if (!msg) {
        res.status = 404;
        return res.end();
      }

      if (
        req.session?.passport?.user !== msg.creator._id.toString()
        && !req.user.is_admin
      ) {
        res.status = 401;
        res.end();
      }
      else {
        Message.findByIdAndDelete(msg.id) 
          .exec((err, msg) => {
            if (err) {
              let error = new ServerErr(err.message);
              return next(error);
            }
            
            res.status = 200;
            res.end();
          });
      }
    });
}

controllers.pinMessagePOST = (req, res, next) => {
  if (!req.user.is_admin) {
    res.status = 401;
    res.end();
  }
  else {
    Message.findById(req.params.msgId)
      .exec((err, msg) => {
        if (err) {
          let error = new ServerErr(err.message);
          return next(error);
        }

        if (!msg) {
          res.status = 404;
          return res.end();
        }

        let messageUpdate = {
          is_pinned: true,
          time: msg.time,
          _id: msg._id,
        }

        Message.findByIdAndUpdate(msg._id, messageUpdate)
          .exec((err, msg) => {
            console.log(msg);
            if (err) {
              let error = new ServerErr(err.message);
              return next(error);
            }

            res.redirect('/');
          });
      });
  }
}

controllers.unpinMessagePOST = (req, res, next) => {
  if (!req.user.is_admin) {
    res.status = 401;
    res.end();
  }
  else {
    Message.findById(req.params.msgId)
      .exec((err, msg) => {
        if (err) {
          let error = new ServerErr(err.message);
          return next(error);
        }

        if (!msg) {
          res.status = 404;
          return res.end();
        }

        let messageUpdate = {
          is_pinned: false,
          time: msg.time,
          _id: msg._id,
        }

        Message.findByIdAndUpdate(msg._id, messageUpdate)
          .exec((err, msg) => {
            if (err) {
              let error = new ServerErr(err.message);
              return next(error);
            }

            res.redirect('/');
          });
      });
  }
}

module.exports = controllers;

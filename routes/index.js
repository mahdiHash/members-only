const express = require('express');
const router = express.Router();
const messageControllers = require('../controllers/messageController');

// GET home page. 
router.get('/', messageControllers.getAllMessages);

// GET about page
router.get('/about', (req, res, next) => {
  res.render('about', { title: 'About Pizza Discuss' });
});

module.exports = router;

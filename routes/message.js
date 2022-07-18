const router = require('express').Router();
const messageControllers = require('../controllers/messageController');

// GET message create
router.get('/create', messageControllers.createMessageGET);

// POST message create
router.post('/create', messageControllers.createMessagePOST);

// GET edit message 
router.get('/edit/:msgId', messageControllers.editMessageGET);

// POST edit message 
router.post('/edit/:msgId', messageControllers.editMessagePOST);

// POST delete message
router.post('/delete/:msgId', messageControllers.deleteMessagePOST);

// POST pin message 
router.post('/pin/:msgId', messageControllers.pinMessagePOST);

// POST unpin message
router.post('/unpin/:msgId', messageControllers.unpinMessagePOST);

module.exports = router;

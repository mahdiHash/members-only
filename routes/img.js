const router = require('express').Router();
const imgControllers = require('../controllers/imgController');

router.get('/:imgName', imgControllers.getImage);

module.exports = router;

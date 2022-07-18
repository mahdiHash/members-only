const router = require('express').Router();
const userControllers = require('../controllers/usersController');

// GET signup page
router.get('/signup', (req, res, next) => {
  res.render('signup', { title: 'Sign Up' });
});

// POST users/signup
router.post('/signup', userControllers.userSignupPOST);

// GET login page
router.get('/login', (req, res, next) => {
  res.render('login', { title: 'Log in' });
})

// POST users/login
router.post('/login', userControllers.userLoginPOST);

// GET logout
router.get('/logout', (req, res, next) => {
  req.logout();
  res.redirect('/');
});

// GET user profile edit
router.get('/edit-profile', userControllers.userProfileEditGET);

// POST user profile edit
router.post('/edit-profile', userControllers.userProfileEditPOST);

// GET become premium
router.get('/become-premium', userControllers.becomePremiumGET);

// POST become premium
router.post('/become-premium', userControllers.becomePremiumPOST);

// GET reset password
router.get('/reset-password', userControllers.resetPassGET);

// POST reset password
router.post('/reset-password', userControllers.resetPassPOST);

// GET user profile
router.get('/:username', userControllers.userProfileGET);

module.exports = router;

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController.js');
const { isSignedIn } = require('../middleware/authMiddleware.js');
const { loginLimiter } = require('../middleware/loginRatelimiter.js');

// Auth Paths
router.get('/login', isSignedIn, authController.loginPage);
router.get('/register', isSignedIn, authController.registerPage);

router.post('/register', authController.postRegister);

router.post('/login', loginLimiter, authController.postLogin);

router.get('/logout', authController.logout);

module.exports = { router };
exports.router = router;
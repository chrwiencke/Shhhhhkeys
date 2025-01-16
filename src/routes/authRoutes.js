const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController.js');
const { isSignedIn } = require('../middleware/authMiddleware.js');
const { loginLimiter } = require('../middleware/loginRatelimiter.js');
const { requireAuth } = require('../middleware/authMiddleware.js');
const { generalLimiter } = require('../middleware/generalRatelimter.js');

// Auth Paths
router.get('/login', generalLimiter, isSignedIn, authController.loginPage);
router.get('/register', generalLimiter, isSignedIn, authController.registerPage);

router.post('/register', generalLimiter, authController.postRegister);

router.post('/login', generalLimiter, loginLimiter, authController.postLogin);

router.post('/change-password', generalLimiter, requireAuth, authController.postChangePassword);

router.post('/reset-password', generalLimiter, loginLimiter, authController.postResetPassword);

router.get('/verify-email/:token', generalLimiter, authController.getVerify);
router.get('/verify-password/:token', generalLimiter, authController.getResetPassword);

router.get('/logout', generalLimiter, authController.logout);
router.get('/verified', generalLimiter, authController.verifiedPage);
router.get('/email-sent', generalLimiter, authController.emailSentPage);
router.get('/reset-password', generalLimiter, authController.resetPasswordPage);
router.get('/change-password', generalLimiter, authController.resetPasswordPage);

module.exports = { router };
exports.router = router;
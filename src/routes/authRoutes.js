const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController.js');
const { isSignedIn } = require('../middleware/authMiddleware.js');
const { loginLimiter } = require('../middleware/loginRatelimiter.js');
const { requireAuth } = require('../middleware/authMiddleware.js');

// Auth Paths
router.get('/login', isSignedIn, authController.loginPage);
router.get('/register', isSignedIn, authController.registerPage);

router.post('/register', authController.postRegister);

router.post('/login', loginLimiter, authController.postLogin);

router.post('/change-password', requireAuth, authController.postChangePassword);

router.post('/reset-password', loginLimiter, authController.postResetPassword);

router.get('/verify-email/:token', authController.getVerify);
router.get('/verify-password/:token', authController.getResetPassword);

router.get('/logout', authController.logout);
router.get('/verified', authController.verifiedPage);
router.get('/email-sent', authController.emailSentPage);
router.get('/reset-password', authController.resetPasswordPage);
router.get('/change-password', authController.resetPasswordPage);

module.exports = { router };
exports.router = router;
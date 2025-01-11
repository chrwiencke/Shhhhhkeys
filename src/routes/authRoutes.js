const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController.js');

// Auth Paths
router.get('/login', authController.loginPage);
router.get('/register', authController.registerPage);

router.post('/register', authController.postRegister);

router.post('/login', authController.postLogin);

router.get('/logout', authController.logout);

module.exports = { router };
exports.router = router;
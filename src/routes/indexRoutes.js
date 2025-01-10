const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexController.js');
const { requireAuth } = require('../middleware/authMiddleware.js');

router.get('/', indexController.landingPage);
router.get('/about-us', indexController.aboutPage);

// Auth Paths
router.get('/login', indexController.loginPage);
router.get('/register', indexController.registerPage);

// Authenticated Paths
router.get('/secret', requireAuth, indexController.secretPage);

exports.router = router;
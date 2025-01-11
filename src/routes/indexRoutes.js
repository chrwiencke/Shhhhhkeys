const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexController.js');

// Open Pages
router.get('/', indexController.landingPage);
router.get('/about-us', indexController.aboutPage);

exports.router = router;
const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexController.js');
const { userInfoLandingPage } = require('../middleware/userInfoLandingpage.js');

// Open Pages
router.get('/', userInfoLandingPage, indexController.landingPage);

exports.router = router;
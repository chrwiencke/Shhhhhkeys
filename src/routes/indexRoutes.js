const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexController.js');
const { userInfoLandingPage } = require('../middleware/userInfoLandingpage.js');
const { generalLimiter } = require('../middleware/generalRatelimter.js');

// Open Pages
router.get('/', generalLimiter, userInfoLandingPage, indexController.landingPage);
exports.router = router;
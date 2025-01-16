const express = require('express');
const router = express.Router();

const keyController = require('../controllers/keyController.js');
const { generalLimiter } = require('../middleware/generalRatelimter.js');

router.get('/:user/keys', generalLimiter, keyController.getSshKeys);

router.get('/:user/:title', generalLimiter, keyController.getSshKey);

exports.router = router;
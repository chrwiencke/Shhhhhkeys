const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController.js');
const Level = require('../models/level.js');
const { requireAuth } = require('../middleware/authMiddleware.js');

// Dashboard
router.get('/profile', requireAuth, dashboardController.secretPage);
router.get('/', requireAuth, dashboardController.mainDashboard);
router.get('/create-level', requireAuth, dashboardController.addLevel);
router.post('/create-level', requireAuth, dashboardController.createLevel);

exports.router = router;
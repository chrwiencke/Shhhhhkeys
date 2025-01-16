const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController.js');
const ShhKey = require('../models/shhkey.js');
const { requireAuth } = require('../middleware/authMiddleware.js');

// /dashboard
router.get('/profile', requireAuth, dashboardController.profilePage);
router.get('/profile/change-password', requireAuth, dashboardController.changePassword);
router.get('/add-ssh-key', requireAuth, dashboardController.addShhKeyDashboard);

router.get('/', requireAuth, dashboardController.mainDashboard);

router.post('/create-ssh-key', requireAuth, dashboardController.createSshKeyDashboard);
router.post('/delete-ssh-key/:id', requireAuth, dashboardController.deleteSshKeyDashboard);
router.post('/enable-disable-ssh-key/:id', requireAuth, dashboardController.enabledisableSshKeyDashboard);

exports.router = router;
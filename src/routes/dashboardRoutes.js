const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController.js');
const ShhKey = require('../models/shhkey.js');
const { requireAuth } = require('../middleware/authMiddleware.js');

// /dashboard
router.get('/profile', requireAuth, dashboardController.profilePage);
router.get('/profile/change-password', requireAuth, dashboardController.changePassword);
router.get('/add-ssh-key', requireAuth, dashboardController.addShhKeyDashboard);
router.get('/add-social-key', requireAuth, dashboardController.addSocialShhKeyDashboard);

router.get('/', requireAuth, dashboardController.mainDashboard);

router.post('/create-ssh-key', requireAuth, dashboardController.createSshKeyDashboard);
router.post('/create-social-key', requireAuth, dashboardController.createSocialSshKeyDashboard);
router.post('/create-social-key', requireAuth, dashboardController.createSocialSshKeyDashboard);
router.post('/delete-ssh-key/:id', requireAuth, dashboardController.deleteSshKeyDashboard);
router.post('/delete-social-key/:id', requireAuth, dashboardController.deleteSocialSshKeyDashboard);
router.post('/enable-disable-ssh-key/:id', requireAuth, dashboardController.enabledisableSshKeyDashboard);

exports.router = router;
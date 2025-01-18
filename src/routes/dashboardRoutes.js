const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController.js');
const { requireAuth } = require('../middleware/authMiddleware.js');
const { generalLimiter } = require('../middleware/generalRatelimter.js');

// /dashboard
router.get('/profile', generalLimiter, requireAuth, dashboardController.profilePage);
router.get('/profile/change-password', generalLimiter, requireAuth, dashboardController.changePassword);
router.get('/profile/change-email', generalLimiter, requireAuth, dashboardController.getChangeEmail);
router.get('/add-ssh-key', generalLimiter, requireAuth, dashboardController.addShhKeyDashboard);
router.get('/add-social-key', generalLimiter, requireAuth, dashboardController.addSocialShhKeyDashboard);

router.get('/', generalLimiter, requireAuth, dashboardController.mainDashboard);

router.post('/create-ssh-key', generalLimiter, requireAuth, dashboardController.createSshKeyDashboard);
router.post('/create-social-key', generalLimiter, requireAuth, dashboardController.createSocialSshKeyDashboard);
router.post('/create-social-key', generalLimiter, requireAuth, dashboardController.createSocialSshKeyDashboard);
router.post('/edit-ssh-key', generalLimiter, requireAuth, dashboardController.editSshKeyDashboard);
router.post('/delete-ssh-key/:id', generalLimiter, requireAuth, dashboardController.deleteSshKeyDashboard);
router.post('/delete-social-key/:id', generalLimiter, requireAuth, dashboardController.deleteSocialSshKeyDashboard);
router.post('/enable-disable-ssh-key/:id', generalLimiter, requireAuth, dashboardController.enabledisableSshKeyDashboard);


exports.router = router;
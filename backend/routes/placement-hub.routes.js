const express = require('express');
const router = express.Router();
const placementHubController = require('../controllers/placement-hub.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/analyzed-opportunities', authMiddleware, placementHubController.getAnalyzedOpportunities);
router.get('/job/:id', authMiddleware, placementHubController.getJobDetails);
router.post('/apply', authMiddleware, placementHubController.applyToJob);
router.post('/withdraw', authMiddleware, placementHubController.withdrawApplication);

module.exports = router;

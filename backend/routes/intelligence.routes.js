const express = require('express');
const router = express.Router();
const intelligenceController = require('../controllers/intelligence.controller');
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/dashboard', authMiddleware, dashboardController.getDashboardData);
router.get('/jobs', authMiddleware, intelligenceController.getJobs);
router.post('/analyzer', authMiddleware, intelligenceController.analyzeProximity);

module.exports = router;

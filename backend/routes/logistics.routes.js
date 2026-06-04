const express = require('express');
const router = express.Router();
const logisticsController = require('../controllers/logistics.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/events', authMiddleware, logisticsController.getEvents);
router.post('/events', authMiddleware, logisticsController.addEvent);
router.put('/events/:id', authMiddleware, logisticsController.updateEvent);
router.delete('/events/:id', authMiddleware, logisticsController.deleteEvent);
router.get('/placement-hub', authMiddleware, logisticsController.getPlacementHub);

module.exports = router;

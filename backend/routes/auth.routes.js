const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const upload = require('../middlewares/upload.middleware');
const authMiddleware = require('../middlewares/auth.middleware');

// Public route
router.post('/register-step-1', authController.registerStep1);
router.post('/login', authController.login);

// Protected routes
router.post('/register-step-2', authMiddleware, authController.registerStep2);
router.post('/register-step-3', authMiddleware, upload.single('resume'), authController.registerStep3);
router.post('/update-password', authMiddleware, authController.updatePassword);

module.exports = router;

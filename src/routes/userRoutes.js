const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController')
const auth = require('../middleware/auth');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/requestResetCode', userController.requestResetCode);
router.post('/verifyResetCode', userController.verifyResetCode);
router.post('/resetPassword', userController.resetPassword);

// Protected routes (require authentication)
router.get('/profile', auth, userController.getMyProfile);
router.put('/profile', auth, userController.updateProfile);
router.post('/changePassword', auth, userController.changePassword);

// Admin routes
router.get('/allUsers', userController.getAllUsers);
router.delete('/:userId', userController.deleteUser);
router.get('/:userId', userController.getUserById);

// NEW ADMIN ROUTES FOR USER MANAGEMENT
router.put('/:userId/role', userController.updateUserRole);           // Update user role
router.put('/:userId/status', userController.updateUserStatus);       // Update user status
router.put('/:userId/clear-suspension', userController.clearUserSuspension); // Clear suspension

module.exports = router;
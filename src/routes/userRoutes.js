const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController')


router.post('/register',userController.register);
router.post('/login',userController.login)
router.get('/allUsers',userController.getAllUsers)
router.delete('/:userId',userController.deleteUser)
router.get('/:userId',userController.getUserById);
router.post('/changePassword',userController.changePassword);
router.post('/resetPassword',userController.resetPassword);
router.post('/requestResetCode',userController.requestResetCode);
router.post('/verifyResetCode',userController.verifyResetCode);


// router.delete('/:userId',userController.deleteUser)
// router.get('/:userId',userController.getUserById);
// router.post('/changePassword',userController.changePassword);
// router.post('/requestResetCode',userController.requestResetCode);
// router.post('/verifyResetCode',userController.verifyResetCode);
module.exports=router;
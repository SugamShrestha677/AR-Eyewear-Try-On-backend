const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController')


router.post('/register',userController.register);
router.post('/login',userController.login)
router.get('/allUsers',userController.getAllUsers)
router.delete('/:userId',userController.deleteUser)
router.get('/:userId',userController.getUserById);

module.exports=router;
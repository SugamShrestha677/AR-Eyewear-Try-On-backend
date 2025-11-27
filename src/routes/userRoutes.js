const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController')


router.post('/register',userController.register);
router.post('/login',userController.login)
router.get('/allUsers',userController.getAllUsers)
router.delete('/:userId',userController.deleteUser)
router.get('/:userId',userController.getUserById);
router.post('/changePassword',userController.changePassword);
<<<<<<< HEAD
router.post('/resetPassword',userController.resetPassword);
router.post('/requestResetCode',userController.requestResetCode);
router.post('/verifyResetCode',userController.verifyResetCode);


// router.delete('/:userId',userController.deleteUser)
// router.get('/:userId',userController.getUserById);
// router.post('/changePassword',userController.changePassword);
// router.post('/requestResetCode',userController.requestResetCode);
// router.post('/verifyResetCode',userController.verifyResetCode);
module.exports=router;
=======

router.post('/requestResetCode',userController.requestResetCode);
router.post('/verifyResetCode',userController.verifyResetCode);
router.get('/generateResetCode',userController.generateResetCode);
router.post('/sendResetCodeEmail',userController.sendResetCodeEmail);


module.exports=router;





// const verifyResetCode = async (req, res) => {
//     try {
//         const { email, resetCode } = req.body;
//         if (!email || !resetCode) {
//             return res.status(400).json({ error: "All fields are required!" });
//         }

//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(404).json({ error: "User not found!" });
//         }

//         // Normalize types: stored code is a string. Accept numeric or string input from client.
//         const provided = resetCode === undefined || resetCode === null ? "" : String(resetCode).trim();
//         const stored = user.resetCode === undefined || user.resetCode === null ? "" : String(user.resetCode).trim();

//         // Check expiry
//         if (user.resetCodeExpires && Date.now() > new Date(user.resetCodeExpires).getTime()) {
//             return res.status(400).json({ error: "Reset code expired. Please request a new one." });
//         }

//         if (!stored || stored !== provided) {
//             return res.status(400).json({ error: "Invalid reset code!" });
//         }

//         res.status(200).json({ message: "Reset code verified successfully!" });
//     } catch (error) {
//         console.log("Error verifying reset code!", error);
//         res.status(500).json({ error: "Server error. Please try again later!" });
//     }
// }



// //verify reset code
// const verifyResetCode = async (req, res) => {
//     try {
//         const { email, resetCode } = req.body;
//         if (!email || !resetCode) {
//             return res.status(400).json({ error: "All fields are required!" });
//         }

//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(404).json({ error: "User not found!" });
//         }

//         if (user.resetCode !== resetCode) {
//             return res.status(400).json({ error: "Invalid reset code!" });
//         }

//         res.status(200).json({ message: "Reset code verified successfully!" });
//     } catch (error) {
//         console.log("Error verifying reset code!", error);
//         res.status(500).json({ error: "Server error. Please try again later!" });
//     }
// }
>>>>>>> 993ca65e0ad6261d529e10e25174a1ca5c9ad150

const config = require('../config/config');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

// Register new User
const register = async(req, res) => {
    try {
        const {username, fullname, email, password, mobile, address }=req.body;
        if (!username || !fullname || !email || !password || !mobile || !address) {
            return res.status(400).json({error:"All fields are required."});
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({error:"User Already exists"});
        }
        const hashedPassword = await bcrypt.hash(password,10);
        const user = new User({
            username,
            fullname,
            email,
            password:hashedPassword,
            address,
            mobile,
        });

        await user.save();
        res.status(201).json({message:"User registered successfully.", user});
    } catch (error) {
        console.log("Error registering user", error)
        res.status(500).json({error:"Server error! Please Try Again Later!"})
    }
}

// Login
const login = async (req,res) => {
    try {
        const {username, password}=req.body;
        if (!username || !password) {
            return res.status(400).json({error:"All fields are required!"});
        }
        const user = await User.findOne({username})
        if (!user) {
            return res.status(400).json({error:"Invalid Credentials!"});
        }
        const isMatch = await bcrypt.compare(password,user.password)
        if (!isMatch) {
            return res.status(400).json({error:"Invalid Credentials!"});

        }

        const token = jwt.sign({userId:user._id}, config.JWT_SECRET,{
            expiresIn:config.JWT_EXPIRATION,
        });
        res.status(200).json({message:"Login Successful",token});
        
    } catch (error) {
        console.log("Error in Logging user",error)
        res.status(400).json({error:"Server error! Please try again later!"});
    }
}

// Get all registered user
const getAllUsers = async(req, res)=>{
    try {
        const users = await User.find().select("-password");
        res.status(200).json({users});
        
    } catch (error) {
        console.log("Error fetching users!", error)
        res.status(500).json({error:"Server error. Please try again later!"});
    }
}

// Delete user
const deleteUser = async(req,res) => {
try {
        const {userId} = req.params;
    // const {username} = req.body;
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
        return res.status(404).json({error:"User not found!"})
    }
    res.status(200).json({message:`User  deleted Successfully!`})
    // res.status(200).json({message:`User ${username} deleted Successfully!`})
    
} catch (error) {
    console.log("Error deleting user", error);
    res.status(500).json({error:"Server error. PLease try again later1"})
}
}

// Get Single User details
const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found!" });
        }
        res.status(200).json({ user });
    } catch (error) {
        console.log("Error fetching user!", error);
        res.status(500).json({ error: "Server error. Please try again later!" });
    }
}

// password reset 
const resetPassword = async (req, res) => {
    try {
        const { email, oldPassword, newPassword } = req.body;
        if (!email || !oldPassword || !newPassword) {
            return res.status(400).json({ error: "All fields are required!" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found!" });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials!" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ message: "Password reset successful!" });
    } catch (error) {
        console.log("Error resetting password!", error);
        res.status(500).json({ error: "Server error. Please try again later!" });
    }
}







module.exports={register,login, getAllUsers, deleteUser, getUserById, resetPassword};
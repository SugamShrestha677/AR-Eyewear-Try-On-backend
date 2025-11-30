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
        const {identifier, password}=req.body; // here identifier is either email or username
        if (!identifier || !password) {
            return res.status(400).json({error:"All fields are required!"});
        }
        const user = await User.findOne({$or:[{username:identifier},{email:identifier}]})
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

// Get logged-in user profile
const getMyProfile = async (req, res) => {
    try {
        // The user ID should be attached to the request object by your authentication middleware
        const userId = req.userId || req.user?.id || req.user?._id;
        
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized access. Please login." });
        }

        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found!" });
        }

        res.status(200).json({ 
            message: "Profile fetched successfully", 
            user: {
                id: user._id,
                username: user.username,
                fullname: user.fullname,
                role: user.role,
                email: user.email,
                mobile: user.mobile,
                address: user.address,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    } catch (error) {
        console.log("Error fetching user profile!", error);
        res.status(500).json({ error: "Server error. Please try again later!" });
    }
}

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const userId = req.userId || req.user?.id || req.user?._id;
        const { fullname, mobile, address } = req.body;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized access. Please login." });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found!" });
        }

        // Update only allowed fields
        if (fullname) user.fullname = fullname;
        if (mobile) user.mobile = mobile;
        if (address) user.address = address;

        await user.save();

        // Return user without password
        const userResponse = await User.findById(userId).select("-password");
        
        res.status(200).json({ 
            message: "Profile updated successfully", 
            user: userResponse 
        });
    } catch (error) {
        console.log("Error updating user profile!", error);
        res.status(500).json({ error: "Server error. Please try again later!" });
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
const changePassword = async (req, res) => {
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

        res.status(200).json({ message: "Password changed successfully!" });
    } catch (error) {
        console.log("Error changing password!", error);
        res.status(500).json({ error: "Server error. Please try again later!" });
    }
}

//verify reset code
const verifyResetCode = async (req, res) => {
    try {
        const { email, resetCode } = req.body;
        if (!email || !resetCode) {
            return res.status(400).json({ error: "All fields are required!" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found!" });
        }

        // Normalize types: accept numeric or string input from client
        const provided = String(resetCode).trim();
        const stored = String(user.resetCode || "").trim();

        if (!stored || stored !== provided) {
            return res.status(400).json({ error: "Invalid reset code!" });
        }

        //Create temporary token (valid for 10 minutes)
        const tempToken = jwt.sign(
            {userId:user._id},
            config.JWT_SECRET,
            {expiresIn:"10m"}
        )

        res.status(200).json({ message: "Reset code verified successfully!", tempToken });
    } catch (error) {
        console.log("Error verifying reset code!", error);
        res.status(500).json({ error: "Server error. Please try again later!" });
    }
}


const resetPassword = async (req,res) => {
    try {
        const {tempToken, newPassword} = req.body;
        if (!tempToken || !newPassword) {
            return res.status(400).json({error:"All fields are required!"})
        }

        const decoded = jwt.verify(tempToken,config.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({error:"User not found!"})
        }

        user.password = await bcrypt.hash(newPassword,10);

        // clear password
        user.resetCode = null;
        user.resetCodeExpires = null;
        await user.save();

        res.status(200).json({message:"Password reset successfully!"})
        
    } catch (error) {
        res.status(500).json({error:"Server error! Please Try again later!"});
        console.log(error,"Error in reseting password!");
    }
}

// request reset code
const requestResetCode = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email is required!" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found!" });
        }

        // Generate reset code and send email (implementation not shown)
        user.resetCode = generateResetCode();
        user.resetCodeExpires=Date.now()+10*60*1000;
        await user.save();

        // Send email with reset code (implementation not shown)
        sendResetCodeEmail(user.email, user.resetCode);

        res.status(200).json({ message: "Reset code sent to email!" });
    } catch (error) {
        console.log("Error requesting reset code!", error);
        res.status(500).json({ error: "Server error. Please try again later!" });
    }
}

const generateResetCode = () => {
   //4 digit code
    return Math.floor(1000 + Math.random() * 9000).toString();
}

const sendResetCodeEmail = (email, resetCode) => {
    // Placeholder function for sending email
    console.log(`Sending reset code ${resetCode} to email: ${email}`);
}


module.exports={register,login, getAllUsers, deleteUser, getUserById, changePassword, requestResetCode,resetPassword, verifyResetCode, generateResetCode, sendResetCodeEmail,getMyProfile,updateProfile};


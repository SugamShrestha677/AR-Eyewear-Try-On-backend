const config = require('../config/config');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// Create nodemailer transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: config.EMAIL_USER,
            pass: config.EMAIL_PASS
        }
    });
};

// Register new User
const register = async(req, res) => {
    try {
        const {username, fullname, email, password, mobile, address } = req.body;
        if (!username || !fullname || !email || !password || !mobile || !address) {
            return res.status(400).json({error:"All fields are required."});
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({error:"User Already exists"});
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            username,
            fullname,
            email,
            password: hashedPassword,
            address,
            mobile,
        });

        await user.save();
        
        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;
        
        res.status(201).json({message:"User registered successfully.", user: userResponse});
    } catch (error) {
        console.log("Error registering user", error);
        res.status(500).json({error:"Server error! Please Try Again Later!"});
    }
}

// Login
const login = async (req, res) => {
    try {
        const {identifier, password} = req.body;
        if (!identifier || !password) {
            return res.status(400).json({error:"All fields are required!"});
        }
        
        const user = await User.findOne({$or:[{username:identifier},{email:identifier}]});
        if (!user) {
            return res.status(400).json({error:"Invalid Credentials!"});
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({error:"Invalid Credentials!"});
        }

        const token = jwt.sign({userId:user._id}, config.JWT_SECRET, {
            expiresIn: config.JWT_EXPIRATION,
        });
        
        res.status(200).json({
            message:"Login Successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                fullname: user.fullname,
                email: user.email,
                role: user.role
            }
        });
        
    } catch (error) {
        console.log("Error in Logging user", error);
        res.status(500).json({error:"Server error! Please try again later!"});
    }
}

// Get logged-in user profile
const getMyProfile = async (req, res) => {
    try {
        const userId = req.userId;
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
                profilePhoto: user.profilePhoto,
                status: user.status,
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
        const userId = req.userId;
        const { fullname, mobile, address, profilePhoto } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found!" });
        }

        // Update allowed fields
        if (fullname) user.fullname = fullname;
        if (mobile) user.mobile = mobile;
        if (address) user.address = address;
        if (profilePhoto) user.profilePhoto = profilePhoto;

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

// Get all registered users (Admin only)
const getAllUsers = async(req, res) => {
    try {
        const users = await User.find().select("-password");
        res.status(200).json({users});
    } catch (error) {
        console.log("Error fetching users!", error);
        res.status(500).json({error:"Server error. Please try again later!"});
    }
}

// Delete user (Admin only)
const deleteUser = async(req, res) => {
    try {
        const {userId} = req.params;
        const user = await User.findByIdAndDelete(userId);
        
        if (!user) {
            return res.status(404).json({error:"User not found!"});
        }
        
        res.status(200).json({message:`User deleted successfully!`});
    } catch (error) {
        console.log("Error deleting user", error);
        res.status(500).json({error:"Server error. Please try again later!"});
    }
}

// Get Single User details (Admin only)
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

// Change password (for authenticated users)
const changePassword = async (req, res) => {
    try {
        const userId = req.userId;
        const { oldPassword, newPassword, logoutAllDevices = false } = req.body;
        
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: "All fields are required!" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found!" });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid current password!" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        
        // If logoutAllDevices is true, update passwordChangedAt to invalidate all existing tokens
        if (logoutAllDevices) {
            user.passwordChangedAt = Date.now();
        }
        
        await user.save();

        // Send password change confirmation email
        await sendPasswordChangeConfirmationEmail(user.email, user.fullname || user.username, logoutAllDevices);

        const response = {
            message: "Password changed successfully!",
            logoutAllDevices: logoutAllDevices
        };

        if (logoutAllDevices) {
            response.note = "You have been logged out from all other devices. Please login again.";
        }

        res.status(200).json(response);
    } catch (error) {
        console.log("Error changing password!", error);
        res.status(500).json({ error: "Server error. Please try again later!" });
    }
}

// Step 1: Request reset code
const requestResetCode = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email is required!" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal that user doesn't exist for security
            return res.status(200).json({ 
                message: "If the email exists, a reset code has been sent!" 
            });
        }

        // Generate 6-digit reset code
        const resetCode = generateResetCode();
        
        // Set reset code and expiration (10 minutes)
        user.resetCode = resetCode;
        user.resetCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        // Send email with reset code
        const emailSent = await sendResetCodeEmail(user.email, resetCode, user.fullname || user.username);

        if (!emailSent) {
            return res.status(500).json({ error: "Failed to send reset code email. Please try again." });
        }

        res.status(200).json({ 
            message: "If the email exists, a reset code has been sent!",
            expiresIn: "10 minutes"
        });
    } catch (error) {
        console.log("Error requesting reset code!", error);
        res.status(500).json({ error: "Server error. Please try again later!" });
    }
}

// Step 2: Verify reset code
const verifyResetCode = async (req, res) => {
    try {
        const { email, resetCode } = req.body;
        if (!email || !resetCode) {
            return res.status(400).json({ error: "Email and reset code are required!" });
        }

        const user = await User.findOne({ 
            email, 
            resetCodeExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.status(400).json({ 
                error: "Invalid reset code or code has expired. Please request a new code." 
            });
        }

        // Normalize types
        const provided = String(resetCode).trim();
        const stored = String(user.resetCode || "").trim();

        if (stored !== provided) {
            return res.status(400).json({ error: "Invalid reset code!" });
        }

        // Create temporary token for password reset
        const tempToken = jwt.sign(
            { userId: user._id, purpose: 'password_reset' },
            config.JWT_SECRET,
            { expiresIn: "10m" }
        );

        res.status(200).json({ 
            message: "Reset code verified successfully!", 
            tempToken 
        });
    } catch (error) {
        console.log("Error verifying reset code!", error);
        res.status(500).json({ error: "Server error. Please try again later!" });
    }
}

// Step 3: Reset password with temporary token
const resetPassword = async (req, res) => {
    try {
        const { tempToken, newPassword, logoutAllDevices = true } = req.body;
        if (!tempToken || !newPassword) {
            return res.status(400).json({ error: "All fields are required!" });
        }

        // Verify the temporary token
        const decoded = jwt.verify(tempToken, config.JWT_SECRET);
        
        // Check if token is for password reset purpose
        if (decoded.purpose !== 'password_reset') {
            return res.status(400).json({ error: "Invalid token!" });
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found!" });
        }

        // Update password
        user.password = await bcrypt.hash(newPassword, 10);
        
        // For password reset, always log out all devices for security
        user.passwordChangedAt = Date.now();
        
        // Clear reset code fields
        user.resetCode = null;
        user.resetCodeExpires = null;
        
        await user.save();

        // Send confirmation email
        await sendPasswordResetConfirmationEmail(user.email, user.fullname || user.username);

        res.status(200).json({ 
            message: "Password reset successfully!",
            logoutAllDevices: true,
            note: "You have been logged out from all devices. Please login with your new password."
        });
        
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ error: "Reset token has expired. Please request a new reset code." });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(400).json({ error: "Invalid reset token!" });
        }
        console.log("Error in resetting password!", error);
        res.status(500).json({ error: "Server error! Please try again later!" });
    }
}

// Generate 6-digit reset code
const generateResetCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send reset code email via Gmail
const sendResetCodeEmail = async (email, resetCode, username) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: `"NetraFit" <${config.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset Code - NetraFit',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p>Hello ${username},</p>
                    <p>You have requested to reset your password. Use the following verification code:</p>
                    
                    <div style="background-color: #f4f4f4; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px;">
                        <h1 style="margin: 0; color: #333; font-size: 32px; letter-spacing: 5px;">${resetCode}</h1>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">
                        <strong>This code will expire in 10 minutes.</strong>
                    </p>
                    
                    <p>If you didn't request this reset, please ignore this email. Your account remains secure.</p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">
                        This is an automated message. Please do not reply to this email.
                    </p>
                </div>
            `,
            text: `Password Reset Request\n\nHello ${username},\n\nYou have requested to reset your password. Use the following verification code:\n\n${resetCode}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this reset, please ignore this email.`
        };

        await transporter.sendMail(mailOptions);
        console.log(`Reset code sent successfully to: ${email}`);
        return true;
        
    } catch (error) {
        console.log("Error sending reset email:", error);
        return false;
    }
}

// Send password change confirmation email
const sendPasswordChangeConfirmationEmail = async (email, username, logoutAllDevices) => {
    try {
        const transporter = createTransporter();
        
        const securityNote = logoutAllDevices 
            ? "You have been logged out from all other devices for security."
            : "You are still logged in on your other devices.";

        const mailOptions = {
            from: `"NetraFit" <${config.EMAIL_USER}>`,
            to: email,
            subject: 'Password Changed Successfully - NetraFit',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4CAF50;">Password Changed Successfully</h2>
                    <p>Hello ${username},</p>
                    <p>Your password has been successfully changed.</p>
                    
                    <div style="background-color: #f8fff8; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
                        <p style="margin: 0; font-weight: bold;">Security Notice:</p>
                        <p style="margin: 10px 0 0 0;">${securityNote}</p>
                    </div>
                    
                    <p>If you did not make this change, please contact our support team immediately to secure your account.</p>
                    
                    <p>Thank you for keeping your account secure!</p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">
                        This is an automated message. Please do not reply to this email.
                    </p>
                </div>
            `,
            text: `Password Changed Successfully\n\nHello ${username},\n\nYour password has been successfully changed.\n\nSecurity Notice:\n${securityNote}\n\nIf you did not make this change, please contact our support team immediately to secure your account.\n\nThank you for keeping your account secure!`
        };

        await transporter.sendMail(mailOptions);
        console.log(`Password change confirmation sent to: ${email}`);
        return true;
        
    } catch (error) {
        console.log("Error sending password change confirmation email:", error);
        return false;
    }
}

// Send password reset confirmation email
const sendPasswordResetConfirmationEmail = async (email, username) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: `"NetraFit" <${config.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset Successful - NetraFit',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4CAF50;">Password Reset Successful</h2>
                    <p>Hello ${username},</p>
                    <p>Your password has been successfully reset.</p>
                    
                    <div style="background-color: #f8fff8; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
                        <p style="margin: 0; font-weight: bold;">Security Notice:</p>
                        <p style="margin: 10px 0 0 0;">You have been logged out from all devices for security. Please login with your new password.</p>
                    </div>
                    
                    <p>If you did not perform this action, please contact our support team immediately.</p>
                    
                    <p>Thank you for using our service!</p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">
                        This is an automated message. Please do not reply to this email.
                    </p>
                </div>
            `,
            text: `Password Reset Successful\n\nHello ${username},\n\nYour password has been successfully reset.\n\nSecurity Notice:\nYou have been logged out from all devices for security. Please login with your new password.\n\nIf you did not perform this action, please contact our support team immediately.\n\nThank you for using our service!`
        };

        await transporter.sendMail(mailOptions);
        console.log(`Password reset confirmation sent to: ${email}`);
        return true;
        
    } catch (error) {
        console.log("Error sending confirmation email:", error);
        return false;
    }
}

module.exports = {
    register,
    login, 
    getAllUsers, 
    deleteUser, 
    getUserById, 
    changePassword, 
    requestResetCode,
    resetPassword, 
    verifyResetCode, 
    generateResetCode, 
    sendResetCodeEmail,
    sendPasswordResetConfirmationEmail,
    sendPasswordChangeConfirmationEmail,
    getMyProfile,
    updateProfile
};
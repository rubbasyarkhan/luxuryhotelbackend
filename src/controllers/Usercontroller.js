import express from "express";
import { Usermodle } from "../Models/User.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import sendMail from "../utils/email-send.js";

export const Signup = async (req, res) => {
  try {
    const { name, email, password, role = 'Guest' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please fill all required fields (name, email, password).",
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Please upload a profile image." });
    }

    const validRoles = ['Admin', 'Manager', 'Receptionist', 'Housekeeping', 'Guest'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role specified." });
    }

    const existingUser = await Usermodle.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const profileImage = req.file.path;

    const newUser = await Usermodle.create({
      name,
      email,
      password: hashedPassword,
      profileImage,
      role,
    });

    const payload = { user: { id: newUser._id } };
    const jwtSecret = process.env.JWT_SECRET_KEY || "luxurystay-super-secret-jwt-key-2024";
    const token = jwt.sign(payload, jwtSecret, { expiresIn: "1h" });

    newUser.token = token;
    await newUser.save();

    res.status(201).json({
      message: "User signup successful",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        profileImage: newUser.profileImage,
        token: newUser.token,
      },
    });
  } catch (error) {
    console.error("Signup controller error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please Fill All the fields" });
    }

    const user = await Usermodle.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated. Please contact administrator." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect Password" });
    }

    const payload = { user: { id: user._id } };
    const jwtSecret = process.env.JWT_SECRET_KEY || "luxurystay-super-secret-jwt-key-2024";
    const token = jwt.sign(payload, jwtSecret, { expiresIn: "1h" });

    user.token = token;
    user.lastLogin = new Date();
    await user.save();

    res.json({
      message: "Login Successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        token: user.token,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.log(`Login controller has errors: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const AddUsers = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Allfield is required",
        status: "failed"
      });
    }

    const validRoles = ['Manager', "Staff", 'Receptionist', 'Housekeeping', 'Maintenance'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Valid roles: Manager, Receptionist, Housekeeping, Maintenance",
        status: "failed"
      });
    }


    const existingUser = await Usermodle.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: "User with this email already exists",
        status: "failed"
      });
    }

    let tempPassword = password;
    if (!password) {
      tempPassword = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 10);
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);

    const newUser = new Usermodle({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      isActive: true,
      createdAt: new Date(),
    });

    await newUser.save();

    try {
      await sendMail({
        email: [email],
        templateName: "new_user_added",
        templateVariables: {
          userName: name,
          userRole: role,
          tempPassword: tempPassword
        }
      });

      console.log(`Welcome email sent to ${email} for role: ${role}`);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.status(201).json({
      message: `${role} added successfully. Welcome email sent to ${email}`,
      status: "success",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        createdAt: newUser.createdAt
      }
    });

  } catch (error) {
    console.error('AddUsers error:', error);
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed"
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { role } = req.params;

    let users;
    if (role) {
      users = await Usermodle.find({ role }, { password: 0, token: 0, otp: 0 });
    } else {
      users = await Usermodle.find({}, { password: 0, token: 0, otp: 0 });
    }

    res.json({ users });

  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const EditUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, phone } = req.body;

    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await Usermodle.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // update fields agar provide kiye gaye hain
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;

    if (password) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      user.password = hashedPassword;
    }

    await user.save();

    return res.status(200).json({
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Edit user error:", error);
    return res.status(500).json({ message: error.message });
  }
};


export const deleteUser = async (req, res) => {
  try {
    const { id, entity } = req.params;

    if (!id || !entity) {
      return res.status(400).json({ message: "Id and entity are required" });
    }

    const db = mongoose.connection.db;

    const objectId = new mongoose.Types.ObjectId(id);

    const doc = await db.collection(entity).findOne({ _id: objectId });

    if (!doc) {
      return res.status(404).json({ message: "Entity not found" });
    }

    await db.collection(entity).deleteOne({ _id: objectId });

    return res.status(200).json({
      message: `${entity} record deleted successfully`,
      deletedId: id,
    });

  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({ message: error.message });
  }
};



export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ['Admin', 'Manager', 'Receptionist', "Staff", 'Housekeeping', 'Guest'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role specified." });
    }

    const user = await Usermodle.findByIdAndUpdate(
      userId,
      { role },
      { new: true, select: '-password -token -otp' }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User role updated successfully", user });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await Usermodle.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error("Toggle user status error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await Usermodle.findById(req.user.id, { password: 0, token: 0, otp: 0 });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "All fields are required", status: "failed" });
    }

    const user = await Usermodle.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found", status: "failed" });
    }

    const otp = Math.floor(Math.random() * 900000 + 100000);

    const mailResponse = await sendMail({
      email: [email],
      subject: "OTP Verification Code",
      templateName: "forgot_password",
      templateVariables: {
        otp: otp.toString(),
        userName:user.name
      }
    });

    if (!mailResponse) {
      return res.status(500).json({ message: "Failed to send otp, please try later", status: "failed" });
    }

    user.otp = {
      value: otp.toString(),
      expireAt: new Date(Date.now() + 1000 * 60 * 10),
      verified: false,
    };

    await user.save();
    res.status(200).json({ message: "OTP Sent Successfully", status: "success" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", status: "failed" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "All fields are required", status: "failed" });
    }

    const user = await Usermodle.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found", status: "failed" });
    }

    if (user.otp.value !== otp.toString()) {
      return res.status(400).json({ message: "Invalid OTP", status: "failed" });
    }

    const currentTime = new Date();
    if (user.otp.expireAt < currentTime) {
      return res.status(400).json({ message: "OTP is expired", status: "failed" });
    }

    user.otp.verified = true;
    await user.save();
    res.status(200).json({ message: "OTP Verified Successfully", status: "success" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", status: "failed" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required", status: "failed" });
    }

    const user = await Usermodle.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found", status: "failed" });
    }

    if (!user.otp.verified) {
      return res.status(400).json({ message: "OTP Authentication failed, you are not verified user", status: "failed" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    user.password = hashedPassword;
    user.otp.verified = false;

    const payload = { user: { id: user._id } };
    const jwtSecret = process.env.JWT_SECRET_KEY || "luxurystay-super-secret-jwt-key-2024";
    const token = jwt.sign(payload, jwtSecret, { expiresIn: "1y" });

    await user.save();

    res.status(200).json({
      message: "Password Reset Successful",
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", status: "failed" });
  }
};

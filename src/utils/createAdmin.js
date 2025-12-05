import bcrypt from "bcryptjs";
import { Usermodle } from "../Models/User.model.js";
import dotenv from "dotenv";

dotenv.config();

const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await Usermodle.findOne({ role: 'Admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    const adminData = {
      name: "System Administrator",
      email: "admin@luxurystay.com",
      password: await bcrypt.hash("admin123", 10),
      profileImage: "default-admin-avatar.jpg", 
      role: "Admin",
      isActive: true
    };

    const admin = await Usermodle.create(adminData);
    console.log('Admin user created successfully:', {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    });
    console.log('Default admin credentials:');
    console.log('Email: admin@luxurystay.com');
    console.log('Password: admin123');
    console.log('Please change these credentials after first login!');

  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Run the function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createAdminUser();
}

export default createAdminUser;

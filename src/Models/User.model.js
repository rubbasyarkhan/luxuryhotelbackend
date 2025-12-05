import mongoose from "mongoose";

const Userschema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImage: { type: String, default:""},
  role: {
    type: String,
    enum: ['Admin', 'Manager', 'Receptionist', "Staff" ,   'Maintenance' , 'Housekeeping', 'Guest'],
    default: 'Guest'
  },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  phone: { type: String },
  token: { type: String, default: "" },
  otp: {
    value: { type: String },
    expireAt: { type: Date },
    verified: { type: Boolean, default: false },
  },
}, {
  timestamps: true
});

export const Usermodle = mongoose.model("User", Userschema);
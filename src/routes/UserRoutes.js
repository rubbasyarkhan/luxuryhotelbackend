import express from "express";
import {
  forgotPassword,
  Login,
  resetPassword,
  Signup,
  verifyOtp,
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  getProfile,
  AddUsers,
  deleteUser,
  EditUser
} from "../controllers/Usercontroller.js";
import upload from "../middleware/Multer.middleware.js";
import authMiddleware, {
  requireAdmin,
  requireManager,
  requireReceptionist,
  requireHousekeeping,
  requireGuest
} from "../middleware/Auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/Signup", upload.single("profileImage"), Signup);
router.post("/Login", Login);
router.post("/forgotpassword", forgotPassword);
router.post("/verifyotp", verifyOtp);
router.post("/resetpassword", resetPassword);
router.post("/Adduser", authMiddleware, AddUsers)

router.get("/profile", authMiddleware, getProfile);

router.get("/users/:role?", authMiddleware, getAllUsers);
router.put('/users/:id' , authMiddleware , EditUser)
router.delete("/:id/:entity" , authMiddleware , deleteUser)
router.patch("/:userId/role", authMiddleware, requireAdmin, updateUserRole);
router.patch("/users/:userId/status", authMiddleware, requireAdmin, toggleUserStatus);


export default router;

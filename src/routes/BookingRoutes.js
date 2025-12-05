import express from "express";
import {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  checkIn,
  checkOut,
  cancelBooking,
  getBookingStatistics,
  deleteBooking
} from "../controllers/BookingController.js";
import authMiddleware from "../middleware/Auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Booking operations
router.post("/", createBooking);
router.get("/", getAllBookings);
router.delete("/:id", deleteBooking);
router.get("/statistics", getBookingStatistics);
router.get("/:id", getBookingById);
router.put("/:id", updateBooking);
router.patch("/:id/checkin", checkIn);
router.patch("/:id/checkout", checkOut);
router.patch("/:id/cancel", cancelBooking);

export default router;

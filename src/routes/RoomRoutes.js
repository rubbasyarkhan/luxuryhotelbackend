import express from "express";
import {
  createRoom,
  getAllRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  updateRoomStatus,
  getAvailableRooms,
  getRoomStatistics
} from "../controllers/RoomController.js";
import  authMiddleware  from "../middleware/Auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createRoom);
router.get("/", getAllRooms);
router.get("/available", getAvailableRooms);
router.get("/statistics", getRoomStatistics);
router.get("/:id", getRoomById);
router.put("/:id", updateRoom);
router.patch("/:id/status", updateRoomStatus);
router.delete("/:id", deleteRoom);

export default router;

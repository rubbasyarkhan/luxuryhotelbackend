import express from "express";
import authMiddleware, { requireAdmin } from "../middleware/Auth.middleware.js";
import { getSettings, updateSettings } from "../controllers/SettingsController.js";

const router = express.Router();

router.get('/', authMiddleware, getSettings);
router.put('/', authMiddleware, requireAdmin, updateSettings);

export default router;

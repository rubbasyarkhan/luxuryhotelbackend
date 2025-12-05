import express from "express";
import authMiddleware from "../middleware/Auth.middleware.js";
import { getBilling, getInvoice, addPayment, addRefund, updatePaymentStatus, getInvoicePdf } from "../controllers/BillingController.js";

const router = express.Router();

router.get("/", authMiddleware, getBilling);
router.get("/:bookingId/invoice", authMiddleware, getInvoice);
router.get("/:bookingId/invoice.pdf", authMiddleware, getInvoicePdf);
router.post("/:bookingId/payments", authMiddleware, addPayment);
router.post("/:bookingId/refund", authMiddleware, addRefund);
router.patch("/:bookingId/status", authMiddleware, updatePaymentStatus);

export default router;

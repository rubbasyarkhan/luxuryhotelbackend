import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  amount: { type: Number, required: true, min: 0 },
  method: { type: String, enum: ['Cash', 'Card', 'UPI', 'Online'], required: true },
  type: { type: String, enum: ['payment', 'refund'], default: 'payment' },
  note: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export const PaymentModel = mongoose.model("Payment", PaymentSchema);

import mongoose from "mongoose";

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  booking: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Booking', 
    required: true 
  },
  guest: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  room: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Room', 
    required: true 
  },
  items: [{
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 }
  }],
  subtotal: { 
    type: Number, 
    required: true,
    min: 0
  },
  taxRate: { 
    type: Number, 
    default: 0.1 // 10% tax
  },
  taxAmount: { 
    type: Number, 
    required: true,
    min: 0
  },
  totalAmount: { 
    type: Number, 
    required: true,
    min: 0
  },
  status: { 
    type: String, 
    enum: ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'],
    default: 'Draft'
  },
  dueDate: { 
    type: Date 
  },
  paidDate: { 
    type: Date 
  },
  paymentMethod: { 
    type: String,
    enum: ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'UPI', 'Wallet']
  },
  notes: { 
    type: String 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, {
  timestamps: true
});

// Generate invoice number before saving
InvoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    this.invoiceNumber = `INV${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export const InvoiceModel = mongoose.model("Invoice", InvoiceSchema);

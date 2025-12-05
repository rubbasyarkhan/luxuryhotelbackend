import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema({
  bookingNumber: { 
    type: String, 
    required: true, 
    unique: true 
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
  checkInDate: { 
    type: Date, 
    required: true 
  },
  checkOutDate: { 
    type: Date, 
    required: true 
  },
  numberOfGuests: { 
    type: Number, 
    required: true,
    min: 1
  },
  totalAmount: { 
    type: Number, 
    required: true,
    min: 0
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Confirmed', 'Checked In', 'Checked Out', 'Cancelled', 'No Show'],
    default: 'Pending'
  },
  paymentStatus: { 
    type: String, 
    enum: ['Pending', 'Paid', 'Partially Paid', 'Refunded'],
    default: 'Pending'
  },
  specialRequests: { 
    type: String 
  },
  additionalServices: [{
    service: { type: String },
    price: { type: Number },
    quantity: { type: Number, default: 1 }
  }],
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  notes: { 
    type: String 
  }
}, {
  timestamps: true
});

BookingSchema.pre('save', async function(next) {
  if (!this.bookingNumber) {
    const count = await mongoose.model('Booking').countDocuments();
    this.bookingNumber = `LS${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export const BookingModel = mongoose.model("Booking", BookingSchema);

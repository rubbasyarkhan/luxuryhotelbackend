import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
  roomNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  roomType: { 
    type: String, 
    required: true,
    enum: ['Standard', 'Deluxe', 'Suite', 'Presidential', 'Family']
  },
  floor: { 
    type: Number, 
    required: true 
  },
  capacity: { 
    type: Number, 
    required: true,
    min: 1,
    max: 10
  },
  pricePerNight: { 
    type: Number, 
    required: true,
    min: 0
  },
  amenities: [{
    type: String,
    enum: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Balcony', 'Ocean View', 'City View', 'Jacuzzi', 'Kitchen', 'Living Room']
  }],
  status: { 
    type: String, 
    enum: ['Available', 'Occupied', 'Maintenance', 'Cleaning', 'Out of Order'],
    default: 'Available'
  },
  description: { 
    type: String 
  },
  images: [{
    type: String // Cloudinary URLs
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastCleaned: { 
    type: Date 
  },
  nextMaintenance: { 
    type: Date 
  }
}, {
  timestamps: true
});

export const RoomModel = mongoose.model("Room", RoomSchema);

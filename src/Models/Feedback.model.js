import mongoose from "mongoose";

const FeedbackSchema = new mongoose.Schema({
  guest: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  booking: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Booking' 
  },
  room: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Room' 
  },
  rating: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5
  },
  categories: {
    cleanliness: { type: Number, min: 1, max: 5 },
    service: { type: Number, min: 1, max: 5 },
    amenities: { type: Number, min: 1, max: 5 },
    value: { type: Number, min: 1, max: 5 },
    location: { type: Number, min: 1, max: 5 }
  },
  title: { 
    type: String, 
    required: true 
  },
  comment: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected', 'Hidden'],
    default: 'Pending'
  },
  isPublic: { 
    type: Boolean, 
    default: true 
  },
  response: {
    message: { type: String },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respondedAt: { type: Date }
  },
  tags: [{
    type: String,
    enum: ['Excellent', 'Good', 'Average', 'Poor', 'Clean', 'Dirty', 'Friendly', 'Rude', 'Fast', 'Slow', 'Modern', 'Outdated']
  }]
}, {
  timestamps: true
});

export const FeedbackModel = mongoose.model("Feedback", FeedbackSchema);

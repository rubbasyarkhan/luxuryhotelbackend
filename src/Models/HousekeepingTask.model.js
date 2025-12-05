import mongoose from "mongoose";

const HousekeepingTaskSchema = new mongoose.Schema({
  taskNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  room: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Room', 
    required: true 
  },
  assignedTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  taskType: { 
    type: String, 
    enum: ['Cleaning', 'Maintenance', 'Setup', 'Inspection', 'Deep Clean'],
    required: true
  },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  scheduledDate: { 
    type: Date, 
    required: true 
  },
  completedDate: { 
    type: Date 
  },
  estimatedDuration: { 
    type: Number, // in minutes
    default: 30
  },
  actualDuration: { 
    type: Number // in minutes
  },
  description: { 
    type: String 
  },
  notes: { 
    type: String 
  },
  issues: [{
    description: { type: String },
    severity: { type: String, enum: ['Low', 'Medium', 'High'] },
    reportedAt: { type: Date, default: Date.now }
  }],
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, {
  timestamps: true
});

// Generate task number before saving
HousekeepingTaskSchema.pre('save', async function(next) {
  if (!this.taskNumber) {
    const count = await mongoose.model('HousekeepingTask').countDocuments();
    this.taskNumber = `HK${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export const HousekeepingTaskModel = mongoose.model("HousekeepingTask", HousekeepingTaskSchema);

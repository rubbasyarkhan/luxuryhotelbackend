import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema({
  hotelName: { type: String, default: 'LuxuryStyle' },
  currency: { type: String, default: 'Rs' },
  taxPercent: { type: Number, default: 0 },
  permissions: {
    Admin: { type: [String], default: [] },
    Manager: { type: [String], default: [] },
    Receptionist: { type: [String], default: [] },
    Housekeeping: { type: [String], default: [] },
    Guest: { type: [String], default: [] }
  }
}, { timestamps: true });

export const SettingsModel = mongoose.model('Settings', SettingsSchema);

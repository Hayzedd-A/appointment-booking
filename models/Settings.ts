import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  workingDays: string[]; // e.g., ['monday', 'tuesday', ...]
  startTime: string; // e.g., '09:00'
  endTime: string; // e.g., '17:00'
  sessionDuration: number; // in minutes, e.g., 30
}

const SettingsSchema: Schema = new Schema({
  workingDays: [{ type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] }],
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  sessionDuration: { type: Number, required: true, min: 1 },
}, {
  timestamps: true,
});

// Ensure only one settings document exists
// SettingsSchema.pre('save', async function(next) {
//   const count = await mongoose.models.Settings.countDocuments();
//   if (count > 0 && !this.isNew) {
//     next(new Error('Only one settings document is allowed'));
//   } else {
//     next();
//   }
// });

export default mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);

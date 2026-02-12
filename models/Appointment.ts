import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
  name: string;
  phone: string;
  extraInfo?: string;
  type: 'visit' | 'accommodate';
  address?: string;
  dateTime: Date;
  sessions: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
}

const AppointmentSchema: Schema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  extraInfo: { type: String },
  type: { type: String, enum: ['visit', 'accommodate'], required: true },
  address: { type: String },
  dateTime: { type: Date, required: true },
  sessions: { type: Number, default: 1, min: 1 },
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
}, {
  timestamps: true,
});

export default mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);

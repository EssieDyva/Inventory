import mongoose, { Schema } from 'mongoose';
import { ILibrary } from '../types';

const librarySchema = new Schema<ILibrary>({
  name: {
    type: String,
    required: [true, 'Il nome della libreria è obbligatorio'],
    trim: true,
    maxlength: [100, 'Il nome non può superare i 100 caratteri']
  },
  maxShelves: {
    type: Number,
    default: 5,
    max: [5, 'Massimo 5 scaffali per libreria']
  }
}, {
  timestamps: true
});

export default mongoose.model<ILibrary>('Library', librarySchema);
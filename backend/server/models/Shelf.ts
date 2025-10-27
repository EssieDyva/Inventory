import mongoose, { Schema } from 'mongoose';
import { IShelf } from '../types';

const shelfSchema = new Schema<IShelf>({
  name: {
    type: String,
    required: [true, 'Il nome dello scaffale è obbligatorio'],
    trim: true
  },
  position: {
    type: Number,
    required: [true, 'La posizione è obbligatoria'],
    min: [1, 'La posizione deve essere tra 1 e 5'],
    max: [5, 'La posizione deve essere tra 1 e 5']
  },
  libraryId: {
    type: Schema.Types.ObjectId,
    ref: 'Library',
    required: [true, 'LibraryId è obbligatorio']
  }
}, {
  timestamps: true
});

shelfSchema.index({ libraryId: 1, position: 1 }, { unique: true });

export default mongoose.model<IShelf>('Shelf', shelfSchema);
import mongoose, { Schema } from 'mongoose';
import { IBook } from '../types';

const bookSchema = new Schema<IBook>({
  title: {
    type: String,
    required: [true, 'Il titolo è obbligatorio'],
    trim: true,
    maxlength: [200, 'Il titolo non può superare i 200 caratteri']
  },
  author: {
    type: String,
    required: [true, 'L\'autore è obbligatorio'],
    trim: true,
    maxlength: [100, 'L\'autore non può superare i 100 caratteri']
  },
  volume: {
    type: Number,
    required: [true, 'Il volume è obbligatorio']
  },
  shelfId: {
    type: Schema.Types.ObjectId,
    ref: 'Shelf',
    required: false,
    default: null
  },
  libraryId: {
    type: Schema.Types.ObjectId,
    ref: 'Library',
    required: false,
    default: null
  },
  status: {
    type: String,
    enum: ['available', 'reading', 'lent'],
    default: 'available'
  },
  coverImage: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indici
bookSchema.index({ title: 1 });
bookSchema.index({ author: 1 });
bookSchema.index({ libraryId: 1, shelfId: 1 });
bookSchema.index({ status: 1 });

export default mongoose.model<IBook>('Book', bookSchema);
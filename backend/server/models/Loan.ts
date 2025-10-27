import mongoose, { Schema, Document } from 'mongoose';

export interface ILoan extends Document {
  bookId: mongoose.Types.ObjectId;
  borrowerName: string;
  borrowerContact?: string;
  borrowerEmail?: string;
  loanDate: Date;
  dueDate: Date;
  returnDate?: Date;
  notes?: string;
  status: 'active' | 'returned' | 'overdue';
  reminderSent: boolean;
  isOverdue(): boolean;
  createdAt: Date;
  updatedAt: Date;
}

const loanSchema = new Schema<ILoan>({
  bookId: {
    type: Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'BookId è obbligatorio']
  },
  borrowerName: {
    type: String,
    required: [true, 'Il nome del prestatore è obbligatorio'],
    trim: true,
    maxlength: [100, 'Il nome non può superare i 100 caratteri']
  },
  borrowerContact: {
    type: String,
    trim: true,
    maxlength: [50, 'Il contatto non può superare i 50 caratteri']
  },
  borrowerEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email non valida']
  },
  loanDate: {
    type: Date,
    required: [true, 'La data di prestito è obbligatoria'],
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: [true, 'La data di scadenza è obbligatoria']
  },
  returnDate: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: [500, 'Le note non possono superare i 500 caratteri']
  },
  status: {
    type: String,
    enum: ['active', 'returned', 'overdue'],
    default: 'active'
  },
  reminderSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indici per performance
loanSchema.index({ bookId: 1, status: 1 });
loanSchema.index({ dueDate: 1, status: 1 });
loanSchema.index({ borrowerName: 1 });

// Metodo per verificare se è in ritardo
loanSchema.methods.isOverdue = function(): boolean {
  if (this.returnDate) return false;
  return new Date() > this.dueDate;
};
// Hook pre-save per aggiornare status automaticamente
// Hook pre-save per aggiornare status automaticamente
loanSchema.pre('save', function (this: ILoan, next) {
  if (!this.returnDate && this.isOverdue()) {
    this.status = 'overdue';
  } else if (this.returnDate) {
    this.status = 'returned';
  } else {
    this.status = 'active';
  }
  next();
});


export default mongoose.model<ILoan>('Loan', loanSchema);
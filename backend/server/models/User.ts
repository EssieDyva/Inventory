import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: [true, 'Username è obbligatorio'],
    unique: true,
    trim: true,
    minlength: [3, 'Username deve essere almeno 3 caratteri'],
    maxlength: [30, 'Username non può superare 30 caratteri']
  },
  email: {
    type: String,
    required: [true, 'Email è obbligatoria'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email non valida']
  },
  password: {
    type: String,
    required: [true, 'Password è obbligatoria'],
    minlength: [6, 'Password deve essere almeno 6 caratteri']
  }
}, {
  timestamps: true
});

// Hash password prima del salvataggio
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Metodo per confrontare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Indici
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

export default mongoose.model<IUser>('User', userSchema);
import { Document, Types } from 'mongoose';

export interface ILibrary extends Document {
  name: string;
  maxShelves: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IShelf extends Document {
  name: string;
  position: number;
  libraryId: string | Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBook extends Document {
  title: string;
  author: string;
  volume: number;
  shelfId: string | Types.ObjectId;
  libraryId: string | Types.ObjectId    ;
  status: 'available' | 'reading' | 'lent';
  coverImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Request types per Express
export interface AuthRequest extends Express.Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

// Response types standardizzate
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  error?: string;
  errors?: any[];
}

// Query parameters per filtri
export interface BookQueryParams {
  libraryId?: string;
  shelfId?: string;
  status?: 'available' | 'reading' | 'lent';
  search?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
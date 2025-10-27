import { Response } from 'express';
import { ApiResponse } from '../types';

/**
 * Middleware per gestire gli errori globali
 */
export const sendError = (res: Response, status: number, message: string, error?: string) => {
  res.status(status).json({ success: false, message, ...(error && { error }) } as ApiResponse);
};
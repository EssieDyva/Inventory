import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { sendError } from '../utils/errors';
import { ApiResponse } from '../types';

const JWT_SECRET_KEY = process.env.JWT_SECRET;
if (!JWT_SECRET_KEY) {
  throw new Error('JWT_SECRET environment variable is not set');
}
const JWT_EXPIRES_IN = '7d';

// @desc    Login utente
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Errori di validazione',
        errors: errors.array()
      } as ApiResponse);
      return;
    }

    const { email, password } = req.body;

    // Trova utente
    const user = await User.findOne({ email });

    if (!user) {
      return sendError(res, 401, 'Credenziali non valide');
    }

    // Verifica password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return sendError(res, 401, 'Credenziali non valide');
    }

    // Genera token JWT
    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      JWT_SECRET_KEY,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Login effettuato con successo',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        }
      }
    } as ApiResponse);

  } catch (error: any) {
    console.error('Errore login:', error);
    sendError(res, 500, 'Errore nel login', error.message);
  }
};

// @desc    Ottieni profilo utente corrente
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return sendError(res, 404, 'Utente non trovato');
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    } as ApiResponse);

  } catch (error: any) {
    console.error('Errore recupero profilo:', error);
    sendError(res, 500, 'Errore nel recupero del profilo', error.message);
  }
};

// Validatori per login
export const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email è obbligatoria')
    .isEmail()
    .withMessage('Email non valida')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password è obbligatoria')
];
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET_KEY = process.env.JWT_SECRET;

export interface JwtPayload {
  id: string;
  username: string;
  email: string;
}

function jwtAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'] as string | undefined;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Accesso negato. Token mancante.' 
    });
  }

  if (!JWT_SECRET_KEY) {
    console.error('JWT_SECRET_KEY is not set.');
    return res.status(500).json({
      success: false,
      message: 'Server misconfiguration: missing JWT secret.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY!) as JwtPayload;
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      message: 'Token non valido o scaduto.' 
    });
  }
}

export default jwtAuthMiddleware;
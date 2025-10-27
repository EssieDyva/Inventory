import { Request, Response, NextFunction } from 'express';
import { isValidObjectId } from '../utils/mongoUtils';

/**
 * Middleware per validare gli ObjectId nei parametri delle route
 */
export const validateObjectId = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramName];
    
    if (!id || !isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: `${paramName} non è un ObjectId valido`
      });
      return;
    }
    
    next();
  };
};

/**
 * Middleware per validare ObjectId multipli nei query parameters
 */
export const validateQueryObjectIds = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    for (const field of fields) {
      const value = req.query[field] as string;
      
      if (value && !isValidObjectId(value)) {
        res.status(400).json({
          success: false,
          message: `${field} non è un ObjectId valido`
        });
        return;
      }
    }
    
    next();
  };
};
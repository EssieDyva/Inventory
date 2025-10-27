import { Types } from 'mongoose';

/**
 * Controlla se una stringa è un ObjectId MongoDB valido
 */
export const isValidObjectId = (id: string): boolean => {
  return Types.ObjectId.isValid(id);
};

/**
 * Converte una stringa in ObjectId se valida
 */
export const toObjectId = (id: string): Types.ObjectId => {
  if (!isValidObjectId(id)) {
    throw new Error(`ID non valido: ${id}`);
  }
  return new Types.ObjectId(id);
};

/**
 * Converte un ObjectId in stringa
 */
export const fromObjectId = (id: Types.ObjectId | string): string => {
  return id.toString();
};

/**
 * Controlla se due ObjectId sono uguali
 */
export const compareObjectIds = (
  id1: Types.ObjectId | string,
  id2: Types.ObjectId | string
): boolean => {
  return fromObjectId(id1) === fromObjectId(id2);
};
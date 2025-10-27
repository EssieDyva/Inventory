import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Library from '../models/Library';
import Shelf from '../models/Shelf';
import Book from '../models/Book';
import { isValidObjectId } from '../utils/mongoUtils';
import { sendError } from '../utils/errors';
import { ApiResponse } from '../types';

// @desc    Get tutti gli scaffali di una libreria
// @route   GET /api/shelves/library/:libraryId
// @access  Public
export const getShelvesByLibrary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { libraryId } = req.params;
    
    if (!isValidObjectId(libraryId)) {
      return sendError(res, 400, 'ID libreria non valido');
    }

    const [library, shelves] = await Promise.all([
      Library.findById(libraryId),
      Shelf.find({ libraryId }).sort({ position: 1 })
    ]);

    if (!library) {
      return sendError(res, 404, 'Libreria non trovata');
    }

    res.json({
      success: true,
      count: shelves.length,
      data: shelves
    } as ApiResponse);
  } catch (error: any) {
    sendError(res, 500, 'Errore nel recuperare gli scaffali', error.message);
  }
};

// @desc    Get singolo scaffale con i suoi libri
// @route   GET /api/shelves/:id
// @access  Public
export const getShelf = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'ID scaffale non valido');
    }

    const [shelf, books] = await Promise.all([
      Shelf.findById(id).populate('libraryId', 'name location'),
      Book.find({ shelfId: id }).sort({ createdAt: -1 })
    ]);
    
    if (!shelf) {
      return sendError(res, 404, 'Scaffale non trovato');
    }

    res.json({
      success: true,
      data: {
        ...shelf.toObject(),
        books,
        booksCount: books.length
      }
    } as ApiResponse);
  } catch (error: any) {
    sendError(res, 500, 'Errore nel recuperare lo scaffale', error.message);
  }
};

// @desc    Get tutti i libri di uno scaffale
// @route   GET /api/shelves/:id/books
// @access  Public
export const getShelfBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'ID scaffale non valido');
    }

    const [shelf, books] = await Promise.all([
      Shelf.findById(id),
      Book.find({ shelfId: id }).sort({ createdAt: -1 })
    ]);

    if (!shelf) {
      return sendError(res, 404, 'Scaffale non trovato');
    }

    res.json({
      success: true,
      count: books.length,
      data: books,
      shelf: {
        id: shelf._id,
        name: shelf.name,
        position: shelf.position
      }
    } as ApiResponse);
  } catch (error: any) {
    sendError(res, 500, 'Errore nel recuperare i libri dello scaffale', error.message);
  }
};

// @desc    Aggiorna scaffale
// @route   PUT /api/shelves/:id
// @access  Public
export const updateShelf = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'ID scaffale non valido');
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Errori di validazione',
        errors: errors.array()
      } as ApiResponse);
      return;
    }

    const shelf = await Shelf.findByIdAndUpdate(
      id,
      { name: req.body.name },
      { new: true, runValidators: true }
    );

    if (!shelf) {
      return sendError(res, 404, 'Scaffale non trovato');
    }

    res.json({
      success: true,
      message: 'Scaffale aggiornato con successo',
      data: shelf
    } as ApiResponse);
  } catch (error: any) {
    sendError(res, 400, 'Errore nell\'aggiornamento dello scaffale', error.message);
  }
};

// Validatori per le richieste
export const validateShelfUpdate = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Il nome è obbligatorio')
    .isLength({ max: 100 })
    .withMessage('Il nome non può superare i 100 caratteri')
];
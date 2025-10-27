import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Loan from '../models/Loan';
import Book from '../models/Book';
import { isValidObjectId } from '../utils/mongoUtils';
import { sendError } from '../utils/errors';
import { ApiResponse } from '../types';

// @desc    Get tutti i prestiti
// @route   GET /api/loans
// @access  Private
export const getLoans = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string;
    const query: any = {};
    
    if (status && ['active', 'returned', 'overdue'].includes(status)) {
      query.status = status;
    }

    const loans = await Loan.find(query)
      .populate('bookId', 'title author volume coverImage')
      .sort({ loanDate: -1 });

    res.json({
      success: true,
      count: loans.length,
      data: loans
    } as ApiResponse);
  } catch (error: any) {
    sendError(res, 500, 'Errore nel recuperare i prestiti', error.message);
  }
};

// @desc    Get singolo prestito
// @route   GET /api/loans/:id
// @access  Private
export const getLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'ID prestito non valido');
    }

    const loan = await Loan.findById(id)
      .populate('bookId', 'title author volume coverImage');

    if (!loan) {
      return sendError(res, 404, 'Prestito non trovato');
    }

    res.json({ success: true, data: loan } as ApiResponse);
  } catch (error: any) {
    sendError(res, 500, 'Errore nel recuperare il prestito', error.message);
  }
};

// @desc    Get prestiti per libro
// @route   GET /api/loans/book/:bookId
// @access  Private
export const getLoansByBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookId } = req.params;

    if (!isValidObjectId(bookId)) {
      return sendError(res, 400, 'ID libro non valido');
    }

    const loans = await Loan.find({ bookId })
      .sort({ loanDate: -1 });

    res.json({
      success: true,
      count: loans.length,
      data: loans
    } as ApiResponse);
  } catch (error: any) {
    sendError(res, 500, 'Errore nel recuperare i prestiti del libro', error.message);
  }
};

// @desc    Crea nuovo prestito
// @route   POST /api/loans
// @access  Private
export const createLoan = async (req: Request, res: Response): Promise<void> => {
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

    const { bookId } = req.body;

    // Verifica che il libro esista
    const book = await Book.findById(bookId);
    if (!book) {
      return sendError(res, 404, 'Libro non trovato');
    }

    // Verifica che il libro non sia già in prestito
    const existingLoan = await Loan.findOne({
      bookId,
      status: { $in: ['active', 'overdue'] }
    });

    if (existingLoan) {
      return sendError(res, 400, 'Questo libro è già in prestito');
    }

    // Crea il prestito
    const loan = await Loan.create(req.body);

    // Aggiorna lo stato del libro a "lent"
    await Book.findByIdAndUpdate(bookId, { status: 'lent' });

    const populatedLoan = await Loan.findById(loan._id)
      .populate('bookId', 'title author volume coverImage');

    res.status(201).json({
      success: true,
      message: 'Prestito creato con successo',
      data: populatedLoan
    } as ApiResponse);
  } catch (error: any) {
    sendError(res, 400, 'Errore nella creazione del prestito', error.message);
  }
};

// @desc    Aggiorna prestito (es. restituisci libro)
// @route   PUT /api/loans/:id
// @access  Private
export const updateLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'ID prestito non valido');
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

    const loan = await Loan.findById(id);
    if (!loan) {
      return sendError(res, 404, 'Prestito non trovato');
    }

    // Se viene impostata una data di restituzione, aggiorna anche lo stato del libro
    if (req.body.returnDate && !loan.returnDate) {
      await Book.findByIdAndUpdate(loan.bookId, { status: 'available' });
    }

    const updatedLoan = await Loan.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('bookId', 'title author volume coverImage');

    res.json({
      success: true,
      message: 'Prestito aggiornato con successo',
      data: updatedLoan
    } as ApiResponse);
  } catch (error: any) {
    sendError(res, 400, 'Errore nell\'aggiornamento del prestito', error.message);
  }
};

// @desc    Restituisci libro
// @route   PUT /api/loans/:id/return
// @access  Private
export const returnLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'ID prestito non valido');
    }

    const loan = await Loan.findById(id);
    if (!loan) {
      return sendError(res, 404, 'Prestito non trovato');
    }

    if (loan.returnDate) {
      return sendError(res, 400, 'Questo libro è già stato restituito');
    }

    loan.returnDate = new Date();
    loan.status = 'returned';
    await loan.save();

    // Aggiorna lo stato del libro
    await Book.findByIdAndUpdate(loan.bookId, { status: 'available' });

    const populatedLoan = await Loan.findById(loan._id)
      .populate('bookId', 'title author volume coverImage');

    res.json({
      success: true,
      message: 'Libro restituito con successo',
      data: populatedLoan
    } as ApiResponse);
  } catch (error: any) {
    sendError(res, 400, 'Errore nella restituzione del libro', error.message);
  }
};

// @desc    Elimina prestito
// @route   DELETE /api/loans/:id
// @access  Private
export const deleteLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, 'ID prestito non valido');
    }

    const loan = await Loan.findById(id);
    if (!loan) {
      return sendError(res, 404, 'Prestito non trovato');
    }

    // Se il prestito è ancora attivo, reimposta lo stato del libro
    if (loan.status === 'active' || loan.status === 'overdue') {
      await Book.findByIdAndUpdate(loan.bookId, { status: 'available' });
    }

    await Loan.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Prestito eliminato con successo'
    } as ApiResponse);
  } catch (error: any) {
    sendError(res, 500, 'Errore nell\'eliminazione del prestito', error.message);
  }
};

// @desc    Get statistiche prestiti
// @route   GET /api/loans/stats
// @access  Private
export const getLoanStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [total, active, overdue, returned] = await Promise.all([
      Loan.countDocuments(),
      Loan.countDocuments({ status: 'active' }),
      Loan.countDocuments({ status: 'overdue' }),
      Loan.countDocuments({ status: 'returned' })
    ]);

    // Prestiti in scadenza nei prossimi 7 giorni
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const dueSoon = await Loan.countDocuments({
      status: 'active',
      dueDate: { $lte: nextWeek, $gte: new Date() }
    });

    res.json({
      success: true,
      data: { total, active, overdue, returned, dueSoon }
    } as ApiResponse);
  } catch (error: any) {
    sendError(res, 500, 'Errore nel recuperare le statistiche', error.message);
  }
};

// Validatori
export const validateLoan = [
  body('bookId')
    .notEmpty()
    .withMessage('BookId è obbligatorio')
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error('BookId non valido');
      }
      return true;
    }),

  body('borrowerName')
    .trim()
    .notEmpty()
    .withMessage('Il nome del prestatore è obbligatorio')
    .isLength({ max: 100 })
    .withMessage('Il nome non può superare i 100 caratteri'),

  body('borrowerContact')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Il contatto non può superare i 50 caratteri'),

  body('borrowerEmail')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Email non valida')
    .normalizeEmail(),

  body('loanDate')
    .optional()
    .isISO8601()
    .withMessage('Data di prestito non valida')
    .toDate(),

  body('dueDate')
    .notEmpty()
    .withMessage('La data di scadenza è obbligatoria')
    .isISO8601()
    .withMessage('Data di scadenza non valida')
    .toDate()
    .custom((value, { req }) => {
      const loanDate = req.body.loanDate ? new Date(req.body.loanDate) : new Date();
      if (new Date(value) <= loanDate) {
        throw new Error('La data di scadenza deve essere successiva alla data di prestito');
      }
      return true;
    }),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Le note non possono superare i 500 caratteri')
];

export const validateLoanUpdate = [
  body('borrowerName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Il nome del prestatore non può essere vuoto')
    .isLength({ max: 100 })
    .withMessage('Il nome non può superare i 100 caratteri'),

  body('borrowerContact')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Il contatto non può superare i 50 caratteri'),

  body('borrowerEmail')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Email non valida')
    .normalizeEmail(),

  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Data di scadenza non valida')
    .toDate(),

  body('returnDate')
    .optional()
    .isISO8601()
    .withMessage('Data di restituzione non valida')
    .toDate(),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Le note non possono superare i 500 caratteri')
];
import { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import Library from "../models/Library";
import Shelf from "../models/Shelf";
import Book from "../models/Book";
import { isValidObjectId } from "../utils/mongoUtils";
import { sendError } from "../utils/errors";
import { ApiResponse, IBook } from "../types";

// @desc    Get tutti i libri
// @route   GET /api/books/
// @access  Public
export const getAllBooks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 30;
    const search = req.query.search ? String(req.query.search) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;
    const sort = req.query.sort ? String(req.query.sort) : "title";

    const pageNum = Number.isNaN(page) ? 1 : Math.max(1, page);
    const limitNum = Number.isNaN(limit) ? 30 : Math.max(1, limit);

    // Calculate the offset
    const offset = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
      ];
    }
    if (status && status !== "all") {
      query.status = status;
    }

    // Build sort object
    let sortObj: any;
    switch (sort) {
      case "title":
        sortObj = { title: 1, volume: 1 };
        break;
      case "author":
        sortObj = { author: 1 };
        break;
      case "volume":
        sortObj = { volume: 1 };
        break;
      case "date":
        sortObj = { createdAt: -1 };
        break;
      default:
        sortObj = { title: 1, volume: 1 };
        break;
    }

    const [books, total] = await Promise.all([
      Book.find(query).sort(sortObj).skip(offset).limit(limitNum).exec(),
      Book.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: books.length,
      data: books,
      total,
      page: pageNum,
    });
  } catch (error: any) {
    sendError(res, 500, "Errore nel recuperare i libri", error.message);
  }
};

// @desc    Get statistiche libri (globali, non filtrate)
// @route   GET /api/books/stats
// @access  Public (protetto da JWT)
export const getBookStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const [total, available, reading, lent] = await Promise.all([
      Book.countDocuments(),
      Book.countDocuments({ status: "available" }),
      Book.countDocuments({ status: "reading" }),
      Book.countDocuments({ status: "lent" }),
    ]);

    res.json({
      success: true,
      data: { total, available, reading, lent },
    } as ApiResponse);
  } catch (error: any) {
    sendError(res, 500, "Errore nel recuperare le statistiche", error.message);
  }
};

// @desc    Get tutti i libri di una libreria
// @route   GET /api/books/library/:libraryId
// @access  Public
export const getBooksByLibrary = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { libraryId } = req.params;

    if (!isValidObjectId(libraryId)) {
      return sendError(res, 400, "ID libreria non valido");
    }

    const [library, books] = await Promise.all([
      Library.findById(libraryId),
      Book.find({ libraryId })
        .populate("shelfId", "name position")
        .sort({ createdAt: -1 }),
    ]);

    if (!library) {
      return sendError(res, 404, "Libreria non trovata");
    }

    res.json({
      success: true,
      count: books.length,
      data: books,
    } as ApiResponse);
  } catch (error: any) {
    sendError(
      res,
      500,
      "Errore nel recuperare i libri della libreria",
      error.message
    );
  }
};

// @desc    Get tutti i libri di uno scaffale
// @route   GET /api/books/shelf/:shelfId
// @access  Public
export const getBooksByShelf = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { shelfId } = req.params;

    if (!isValidObjectId(shelfId)) {
      return sendError(res, 400, "ID scaffale non valido");
    }

    const [shelf, books] = await Promise.all([
      Shelf.findById(shelfId),
      Book.find({ shelfId }).sort({ createdAt: -1 }),
    ]);

    if (!shelf) {
      return sendError(res, 404, "Scaffale non trovato");
    }

    res.json({
      success: true,
      count: books.length,
      data: books,
      shelf: {
        id: shelf._id,
        name: shelf.name,
        position: shelf.position,
      },
    } as ApiResponse);
  } catch (error: any) {
    sendError(
      res,
      500,
      "Errore nel recuperare i libri dello scaffale",
      error.message
    );
  }
};

// @desc    Get singolo libro
// @route   GET /api/books/:id
// @access  Public
export const getBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "ID libro non valido");
    }

    const book = await Book.findById(id)
      .populate("shelfId", "name position")
      .populate("libraryId", "name location");

    if (!book) {
      return sendError(res, 404, "Libro non trovato");
    }

    res.json({ success: true, data: book } as ApiResponse);
  } catch (error: any) {
    sendError(res, 500, "Errore nel recuperare il libro", error.message);
  }
};

// @desc    Crea nuovo libro
// @route   POST /api/books
// @access  Public
export const createBook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Errori di validazione",
        errors: errors.array(),
      } as ApiResponse);
      return;
    }

    const { shelfId, libraryId } = req.body;

    // Verifica esistenza solo se libraryId e shelfId sono forniti
    if (libraryId || shelfId) {
      const [library, shelf] = await Promise.all([
        libraryId ? Library.findById(libraryId) : Promise.resolve(null),
        shelfId
          ? Shelf.findOne({ _id: shelfId, ...(libraryId && { libraryId }) })
          : Promise.resolve(null),
      ]);

      if (libraryId && !library) {
        return sendError(res, 404, "Libreria non trovata");
      }

      if (shelfId && !shelf) {
        return sendError(
          res,
          404,
          "Scaffale non trovato" +
            (libraryId ? " o non appartiene alla libreria specificata" : "")
        );
      }
    }

    const book: IBook = await Book.create(req.body);

    const populatedBook = await Book.findById(book._id)
      .populate("shelfId", "name position")
      .populate("libraryId", "name location");

    res.status(201).json({
      success: true,
      message: "Libro creato con successo",
      data: populatedBook,
    } as ApiResponse);
  } catch (error: any) {
    sendError(res, 400, "Errore nella creazione del libro", error.message);
  }
};

// @desc    Aggiorna libro
// @route   PUT /api/books/:id
// @access  Public
export const updateBook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Errori di validazione",
        errors: errors.array(),
      } as ApiResponse);
      return;
    }

    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("shelfId", "name position")
      .populate("libraryId", "name location");

    if (!book) {
      return sendError(res, 404, "Libro non trovato");
    }

    res.json({
      success: true,
      message: "Libro aggiornato con successo",
      data: book,
    } as ApiResponse);
  } catch (error: any) {
    sendError(res, 400, "Errore nell'aggiornamento del libro", error.message);
  }
};

// @desc    Elimina libro
// @route   DELETE /api/books/:id
// @access  Public
export const deleteBook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "ID libro non valido");
    }

    const book = await Book.findByIdAndDelete(id);

    if (!book) {
      return sendError(res, 404, "Libro non trovato");
    }

    res.json({
      success: true,
      message: "Libro eliminato con successo",
    } as ApiResponse);
  } catch (error: any) {
    sendError(res, 500, "Errore nell'eliminazione del libro", error.message);
  }
};

// Validatori per la creazione di un libro
export const validateBook = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Il titolo è obbligatorio")
    .isLength({ max: 200 })
    .withMessage("Il titolo non può superare i 200 caratteri"),

  body("author")
    .trim()
    .notEmpty()
    .withMessage("L'autore è obbligatorio")
    .isLength({ max: 100 })
    .withMessage("L'autore non può superare i 100 caratteri"),

  body("volume")
    .notEmpty()
    .withMessage("Il volume è obbligatorio")
    .isInt({ min: 1 })
    .withMessage("Il volume deve essere un numero intero positivo")
    .toInt(),

  body("shelfId")
    .optional()
    .custom((value) => {
      if (value && !isValidObjectId(value)) {
        throw new Error("ID scaffale non valido");
      }
      return true;
    }),

  body("libraryId")
    .optional()
    .custom((value) => {
      if (value && !isValidObjectId(value)) {
        throw new Error("ID libreria non valido");
      }
      return true;
    }),

  body("status")
    .optional()
    .isIn(["available", "reading", "lent"])
    .withMessage("Lo status deve essere: available, reading, o lent"),

  body("coverImage")
    .optional()
    .trim()
    .isURL()
    .withMessage("L'immagine di copertina deve essere un URL valido"),
];

// Validatori per l'aggiornamento di un libro (campi opzionali)
export const validateBookUpdate = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Il titolo non può essere vuoto")
    .isLength({ max: 200 })
    .withMessage("Il titolo non può superare i 200 caratteri"),

  body("author")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("L'autore non può essere vuoto")
    .isLength({ max: 100 })
    .withMessage("L'autore non può superare i 100 caratteri"),

  body("volume")
    .optional()
    .notEmpty()
    .withMessage("Il volume non può essere vuoto")
    .isNumeric()
    .withMessage("Il volume deve essere un numero"),

  body("shelfId")
    .optional()
    .custom((value) => {
      if (value && !isValidObjectId(value)) {
        throw new Error("ID scaffale non valido");
      }
      return true;
    }),

  body("libraryId")
    .optional()
    .custom((value) => {
      if (value && !isValidObjectId(value)) {
        throw new Error("ID libreria non valido");
      }
      return true;
    }),

  body("status")
    .optional()
    .isIn(["available", "reading", "lent"])
    .withMessage("Lo status deve essere: available, reading, o lent"),

  body("coverImage")
    .optional()
    .trim()
    .isURL()
    .withMessage("L'immagine di copertina deve essere un URL valido"),
];

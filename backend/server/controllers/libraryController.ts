import { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import Library from "../models/Library";
import Shelf from "../models/Shelf";
import Book from "../models/Book";
import { isValidObjectId } from "../utils/mongoUtils";
import { sendError } from "../utils/errors";
import { ApiResponse } from "../types";

// @desc    Get tutte le librerie
// @route   GET /api/libraries
// @access  Public
export const getLibraries = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const libraries = await Library.aggregate([
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "libraryId",
          as: "books",
        },
      },
      {
        $lookup: {
          from: "shelves",
          localField: "_id",
          foreignField: "libraryId",
          as: "shelves",
        },
      },
      {
        $addFields: {
          totalBooks: { $size: "$books" },
          totalShelves: { $size: "$shelves" },
        },
      },
      {
        $project: {
          books: 0,
          shelves: 0,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);
    res.json({
      success: true,
      count: libraries.length,
      data: libraries,
    });
  } catch (error: any) {
    sendError(res, 500, "Errore nel recuperare le librerie", error.message);
  }
};

// @desc    Get singola libreria con scaffali e libri
// @route   GET /api/libraries/:id
// @access  Public
export const getLibrary = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "ID libreria non valido");
    }

    const [library, shelves, books] = await Promise.all([
      Library.findById(id),
      Shelf.find({ libraryId: id }).sort({ position: 1 }),
      Book.find({ libraryId: id }).sort({ createdAt: -1 }),
    ]);

    if (!library) {
      return sendError(res, 404, "Libreria non trovata");
    }

    // Raggruppa i libri per shelfId
    const booksByShelf = books.reduce((acc, book) => {
      const shelfId = book.shelfId?.toString() || "unassigned";
      if (!acc[shelfId]) {
        acc[shelfId] = [];
      }
      acc[shelfId].push(book);
      return acc;
    }, {} as Record<string, typeof books>);

    // Associa i libri agli scaffali
    const shelvesWithBooks = shelves.map((shelf) => ({
      ...shelf.toObject(),
      books: booksByShelf[shelf._id.toString()] || [],
      booksCount: (booksByShelf[shelf._id.toString()] || []).length,
    }));

    // Libri non assegnati a nessuno scaffale (opzionale)
    const unassignedBooks = booksByShelf["unassigned"] || [];

    res.json({
      success: true,
      data: {
        ...library.toObject(),
        shelves: shelvesWithBooks,
        unassignedBooks,
        totalBooks: books.length,
        totalShelves: shelves.length,
      },
    } as ApiResponse);
  } catch (error: any) {
    sendError(res, 500, "Errore nel recuperare la libreria", error.message);
  }
};

/**
 *
 * @desc    Crea nuova libreria
 * @route   POST /api/libraries
 * @access  Public
 */

export const createLibrary = async (
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
      });
      return;
    }

    const [library, libraryCount] = await Promise.all([
      Library.create(req.body),
      Library.countDocuments(),
    ]);

    // Crea automaticamente 5 scaffali per questa libreria
    const shelvesData = Array.from({ length: 5 }, (_, i) => ({
      name: `Scaffale ${libraryCount}-${i + 1}`,
      position: i + 1,
      libraryId: library._id,
    }));

    const shelves = await Shelf.insertMany(shelvesData);

    res.status(201).json({
      success: true,
      message: "Libreria creata con successo",
      data: { library, shelves },
    });
  } catch (error: any) {
    sendError(res, 400, "Errore nella creazione della libreria", error.message);
  }
};

// @desc    Aggiorna libreria
// @route   PUT /api/libraries/:id
// @access  Public
export const updateLibrary = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const library = await Library.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!library) {
      return sendError(res, 404, "Libreria non trovata");
    }

    res.json({
      success: true,
      message: "Libreria aggiornata con successo",
      data: library,
    });
  } catch (error: any) {
    sendError(
      res,
      400,
      "Errore nell'aggiornamento della libreria",
      error.message
    );
  }
};

// @desc    Elimina libreria
// @route   DELETE /api/libraries/:id
// @access  Public
export const deleteLibrary = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const library = await Library.findById(req.params.id);

    if (!library) {
      return sendError(res, 404, "Libreria non trovata");
    }

    // Elimina tutti gli scaffali e disassocia i libri, poi la libreria
    await Promise.all([
      Shelf.deleteMany({ libraryId: library._id }),
      Book.updateMany(
        { libraryId: library._id },
        { $unset: { libraryId: "", shelfId: "" } }
      ),
    ]);

    await Library.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Libreria eliminata con successo",
    });
  } catch (error: any) {
    sendError(
      res,
      500,
      "Errore nell'eliminazione della libreria",
      error.message
    );
  }
};

// Validatori per le richieste
export const validateLibrary = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Il nome è obbligatorio")
    .isLength({ max: 100 })
    .withMessage("Il nome non può superare i 100 caratteri"),
];

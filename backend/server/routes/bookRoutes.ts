import express from 'express';
import {
  getAllBooks,
  getBookStats,
  getBooksByLibrary,
  getBooksByShelf,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  validateBook,
  validateBookUpdate
} from '../controllers/bookController';
import { validateObjectId } from '../middleware/validation';

const bookRouter = express.Router();

// Route per ottenere tutti i libri di una libreria
bookRouter.route('/library/:libraryId')
  .get(validateObjectId('libraryId'), getBooksByLibrary);

// Route per ottenere tutti i libri di uno scaffale
bookRouter.route('/shelf/:shelfId')
  .get(validateObjectId('shelfId'), getBooksByShelf);

// Route CRUD principali per i libri
bookRouter.route('/')
  .get(getAllBooks)
  .post(validateBook, createBook);

bookRouter.route('/stats')
  .get(getBookStats);

bookRouter.route('/:id')
  .get(validateObjectId('id'), getBook)
  .put(validateObjectId('id'), validateBookUpdate, updateBook)
  .delete(validateObjectId('id'), deleteBook);

export default bookRouter;
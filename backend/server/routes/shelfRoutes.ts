import express from 'express';
import {
  getShelvesByLibrary,
  getShelf,
  getShelfBooks,
  updateShelf,
  validateShelfUpdate
} from '../controllers/shelfController';
import { validateObjectId } from '../middleware/validation';

const shelfRouter = express.Router();

shelfRouter.route('/by-library/:libraryId')
  .get(validateObjectId('libraryId'), getShelvesByLibrary);

shelfRouter.route('/:id')
  .get(validateObjectId('id'), getShelf)
  .put(validateObjectId('id'), validateShelfUpdate, updateShelf);

shelfRouter.route('/:id/books')
  .get(validateObjectId('id'), getShelfBooks);

export default shelfRouter;
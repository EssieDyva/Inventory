import express from 'express';
import {
  getLibraries,
  getLibrary,
  createLibrary,
  updateLibrary,
  deleteLibrary,
  validateLibrary
} from '../controllers/libraryController';
import { validateObjectId } from '../middleware/validation';

const libraryRouter = express.Router();

libraryRouter.route('/')
  .get(getLibraries)
  .post(validateLibrary, createLibrary);

libraryRouter.route('/:id')
  .get(validateObjectId('id'), getLibrary)
  .put(validateObjectId('id'), validateLibrary, updateLibrary)
  .delete(validateObjectId('id'), deleteLibrary);

export default libraryRouter;
import express from 'express';
import {
  getLoans,
  getLoan,
  getLoansByBook,
  createLoan,
  updateLoan,
  returnLoan,
  deleteLoan,
  getLoanStats,
  validateLoan,
  validateLoanUpdate
} from '../controllers/loanController';
import { validateObjectId } from '../middleware/validation';

const loanRouter = express.Router();

// Stats route (prima delle route con :id)
loanRouter.route('/stats')
  .get(getLoanStats);

// Route per libro specifico
loanRouter.route('/book/:bookId')
  .get(validateObjectId('bookId'), getLoansByBook);

// Route CRUD principali
loanRouter.route('/')
  .get(getLoans)
  .post(validateLoan, createLoan);

// Route per restituzione
loanRouter.route('/:id/return')
  .put(validateObjectId('id'), returnLoan);

// Route standard con ID
loanRouter.route('/:id')
  .get(validateObjectId('id'), getLoan)
  .put(validateObjectId('id'), validateLoanUpdate, updateLoan)
  .delete(validateObjectId('id'), deleteLoan);

export default loanRouter;
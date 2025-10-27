import express from 'express';
import {
  login,
  getMe,
  validateLogin
} from '../controllers/authController';
import jwtAuthMiddleware from '../middleware/jwtAuth';

const authRouter = express.Router();

// Route pubbliche
authRouter.post('/login', validateLogin, login);

// Route protette
authRouter.get('/me', jwtAuthMiddleware, getMe);

export default authRouter;
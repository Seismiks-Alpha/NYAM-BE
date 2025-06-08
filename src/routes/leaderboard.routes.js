import express from 'express';
import { getLeaderboard } from '../controllers/leaderboard.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/leaderboard', authenticate, getLeaderboard);

export default router;

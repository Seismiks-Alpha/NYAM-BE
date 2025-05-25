import express from 'express';
import { testChat } from '../controllers/chat.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { chatWithGemini } from '../controllers/chatGemini.controller.js';

// 🔧 deklarasi router duluan
const router = express.Router();

// ✅ pakai middleware authenticate
router.post('/', authenticate, testChat);
router.post('/gemini', authenticate, chatWithGemini);

export default router;

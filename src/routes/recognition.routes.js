// src/routes/recognition.routes.js
import express from 'express';
import multer from 'multer';
import { recognizeFood } from '../controllers/recognition.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/recognize', authenticate, upload.single('image'), recognizeFood);

export default router;

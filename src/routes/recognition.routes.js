import express from 'express';
import multer from 'multer';
import { uploadAndAnalyzeImage } from '../controllers/recognition.controller.js';
import { authenticate } from '../../src/middlewares/auth.middleware.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

router.post('/upload', authenticate, upload.single('image'), uploadAndAnalyzeImage);

export default router;

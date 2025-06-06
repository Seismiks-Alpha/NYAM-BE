import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  postFoodHistory,
  getDailyNutritionProgress,
  getAllFoodHistory,
} from '../controllers/foodHistory.controller.js';

const router = express.Router();

// Semua endpoint membutuhkan autentikasi Firebase
router.use(authenticate);

// Tambahkan histori makanan
router.post('/food-history', postFoodHistory);

// Dapatkan ringkasan konsumsi hari ini & kemarin
router.get('/food-history/today', getDailyNutritionProgress);

// Dapatkan semua histori makanan
router.get('/food-history/all', getAllFoodHistory);

export default router;

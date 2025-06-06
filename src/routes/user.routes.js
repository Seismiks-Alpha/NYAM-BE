// ✅ 3. user.routes.js (Express routes)
import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';

import {
  updateOwnProfile,
  getOwnProfile,
  syncUser,
} from '../controllers/user.controller.js';

const router = express.Router();
router.get('/profile', authenticate, getOwnProfile);
router.put('/profile', authenticate, updateOwnProfile);
router.post('/auth/sync', authenticate, syncUser);

export default router;

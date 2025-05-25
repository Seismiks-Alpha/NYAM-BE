import express from 'express'
import { testChat } from '../controllers/chat.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'

// 🔧 deklarasi router duluan
const router = express.Router()

// ✅ pakai middleware authenticate
router.post('/', authenticate, testChat)

export default router

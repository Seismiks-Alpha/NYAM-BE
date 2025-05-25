// index.js
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import testRoutes from './src/routes/chat.routes.js'
import userRoutes from './src/routes/user.routes.js'
import recognitionRoutes from './src/routes/recognition.routes.js'

dotenv.config()

const app = express()
const prisma = new PrismaClient()


// Middleware
app.use(cors())
app.use(express.json())

// Routes
// app.use('/chat', chatRoutes)
app.use('/api', userRoutes, recognitionRoutes) // ✅ tambahkan ini
app.use('/chat-test', testRoutes)
app.use('/users', userRoutes)




// 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// Error Handler (optional)
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal Server Error' })
})

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
})

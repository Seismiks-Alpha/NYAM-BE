// index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import testRoutes from './src/routes/chat.routes.js';
import userRoutes from './src/routes/user.routes.js';
import recognitionRoutes from './src/routes/recognition.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();

// Serve static HTML for root /
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// app.use('/chat', chatRoutes)
app.use('/api', userRoutes, recognitionRoutes); // ✅ tambahkan ini
app.use('/chat', testRoutes);
app.use('/users', userRoutes);

// 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error Handler (optional)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

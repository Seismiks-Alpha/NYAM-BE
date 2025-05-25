// routes/chat.js (atau sesuaikan dengan project kamu)
const express = require('express');
const router = express.Router();
const { chatWithGemini } = require('../helpers/gemini');

// Endpoint untuk Gemini
router.post('/chat/gemini', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt kosong' });
    }

    const result = await chatWithGemini(prompt);
    res.json({ response: result });
  } catch (error) {
    console.error('Error Gemini:', error);
    res.status(500).json({ error: 'Gagal memproses request Gemini' });
  }
});

module.exports = router;

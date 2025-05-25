import { PrismaClient } from '@prisma/client';
import { askGemini } from '../utils/gemini.js';
import { detectIntent } from '../utils/classifier.js';

const prisma = new PrismaClient();

export const chatWithGemini = async (req, res) => {
  const { question } = req.body;
  const uid = req.user.id; // ✅ ambil dari middleware, bukan body

  try {
    const user = await prisma.user.findUnique({
      where: { id: uid },
      include: {
        profile: true,
        histories: {
          where: {
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
          include: { food: true },
        },
      },
    });

    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

    const intent = detectIntent(question);
    let prompt = '';

    if (intent === 'personal') {
      const foodList = user.histories
        .map(
          (h) =>
            `- ${h.grams}g ${h.food.name} (${((h.food.calories * h.grams) / 100).toFixed(1)} kkal)`
        )
        .join('\n');

      prompt = `User bernama ${user.displayName}, berat ${user.profile.weight}kg, tinggi ${user.profile.height}cm, umur ${user.profile.age} tahun.\n\nHari ini ia makan:\n${foodList}\n\nPertanyaannya: ${question}`;
    } else {
      prompt = question;
    }

    const reply = await askGemini(prompt);
    res.json({ response: reply });
  } catch (err) {
    console.error('❌ Error di Gemini Chat:', err);
    res
      .status(500)
      .json({ error: 'Terjadi kesalahan saat memproses pertanyaan (Gemini)' });
  }
};

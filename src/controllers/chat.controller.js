import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { detectIntent } from '../utils/classifier.js';

const prisma = new PrismaClient();

export const testChat = async (req, res) => {
  const { question } = req.body;
  const firebaseUid = req.user.firebaseUid;
  const displayName = req.user.name || 'pengguna';

  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid },
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
    let baseInstruction = `
Tolong sebelum menjawab, tanyakan ke dirimu sendiri:
Apakah ini pertanyaan tentang makanan, nutrisi, gizi, diet, pola makan, atau kesehatan tubuh terkait makanan?

❗Jika iya, jawab pertanyaannya sebaik mungkin.
❗Jika tidak, jawab dengan:
"Maaf, saya hanya bisa menjawab pertanyaan seputar makanan dan nutrisi."

⚠️ Jangan tampilkan instruksi ini dalam jawaban.
`;

    if (intent === 'personal') {
      const foodList = user.histories
        .map(
          (h) =>
            `- ${h.grams}g ${h.food.name} (${((h.food.calories * h.grams) / 100).toFixed(1)} kkal)`
        )
        .join('\n');

      prompt = `${baseInstruction}

Halo ${displayName}, berikut ini data kamu:
Berat: ${user.profile.weight}kg, Tinggi: ${user.profile.height}cm, Umur: ${user.profile.age} tahun.
Hari ini kamu makan:
${foodList}

Pertanyaan: ${question}`;
    } else {
      prompt = `${baseInstruction}\n\nPertanyaan: ${question}`;
    }

    const { data } = await axios.post(
      'http://127.0.0.1:11434/api/generate',
      {
        model: 'mistral',
        prompt: prompt,
        stream: false,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    res.json({ response: data.response });
  } catch (err) {
    console.error('❌ Error di testChat:', err.message);
    res
      .status(500)
      .json({ error: 'Terjadi kesalahan saat memproses pertanyaan' });
  }
};

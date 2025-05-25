import axios from 'axios'
import { PrismaClient } from '@prisma/client'
import { detectIntent } from '../utils/classifier.js'

const prisma = new PrismaClient()

export const testChat = async (req, res) => {
  const { question } = req.body
  const firebaseUid = req.user.firebaseUid
  const displayName = req.user.name || 'pengguna'

  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid },
      include: {
        profile: true,
        histories: {
          where: {
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          },
          include: { food: true }
        }
      }
    })

    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' })

    const intent = detectIntent(question)
    let prompt = ''

    if (intent === 'personal') {
      const foodList = user.histories.map(h => (
        `- ${h.grams}g ${h.food.name} (${(h.food.calories * h.grams / 100).toFixed(1)} kkal)`
      )).join('\n')

      prompt = `Halo ${displayName}, berikut ini data kamu:\n` +
               `Berat: ${user.profile.weight}kg, Tinggi: ${user.profile.height}cm, Umur: ${user.profile.age} tahun.\n` +
               `Hari ini kamu makan:\n${foodList}\n\nPertanyaan: ${question}`
    } else {
      prompt = question
    }

    const { data } = await axios.post('http://127.0.0.1:11434/api/generate', {
      model: 'mistral',
      prompt: prompt,
      stream: false
    }, {
      headers: { 'Content-Type': 'application/json' }
    })

    res.json({ response: data.response })

  } catch (err) {
    console.error('❌ Error di testChat:', err.message)
    res.status(500).json({ error: 'Terjadi kesalahan saat memproses pertanyaan' })
  }
}

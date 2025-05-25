// src/controllers/recognition.controller.js
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export const recognizeFood = async (req, res) => {
  const image = req.file
  const userId = req.user.id

  if (!image) return res.status(400).json({ error: 'Gambar tidak ditemukan' })

  try {
    // 🔁 Dummy hasil dari model
    const predictions = [
      { food: 'nasi goreng', weight: 180 },
      { food: 'telur dadar', weight: 65 }
    ]

    const results = []

    for (const item of predictions) {
      const foodItem = await prisma.food.findFirst({
        where: { name: item.food.toLowerCase() }
      })

      if (!foodItem) {
        results.push({ food: item.food, error: 'Tidak ditemukan di database' })
        continue
      }

      // Hitung nutrisi berdasarkan berat
      const totalCalories = (foodItem.calories * item.weight) / 100
      const totalProtein = (foodItem.protein * item.weight) / 100
      const totalFat = (foodItem.fat * item.weight) / 100
      const totalCarbs = (foodItem.carbohydrates * item.weight) / 100

      // Simpan ke foodHistory
      await prisma.foodHistory.create({
        data: {
          userId,
          foodId: foodItem.id,
          grams: item.weight,
          date: new Date()
        }
      })

      results.push({
        food: item.food,
        weight: item.weight,
        nutrition: {
          calories: totalCalories,
          protein: totalProtein,
          fat: totalFat,
          carbohydrates: totalCarbs
        }
      })
    }

    // Hapus file upload
    fs.unlink(path.resolve(image.path), () => {})

    res.json({
      message: '✅ Makanan berhasil diproses',
      items: results
    })

  } catch (err) {
    console.error('❌ Gagal proses makanan:', err)
    res.status(500).json({ error: 'Gagal proses makanan' })
  }
}

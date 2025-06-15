import { exec } from 'child_process';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const uploadAndAnalyzeImage = async (req, res) => {
  const userId = req.user.id;
  const imagePath = req.file.path;
  const fileName = req.file.filename;

  const pyPath = path.join('model', 'analyze_image.py');
  const command = `python ${pyPath} ${fileName}`;

  exec(command, async (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Python Error: ${error.message}`);
      return res.status(500).json({ error: 'Python gagal dijalankan' });
    }

    try {
      const parsed = JSON.parse(stdout.trim());
      const output = typeof parsed.stdout === 'string'
        ? JSON.parse(parsed.stdout)
        : parsed;

      if (output.error || !Array.isArray(output.results)) {
        return res.status(400).json({ error: 'Format hasil tidak valid' });
      }

      // ✅ Simpan ke FoodHistory
      const entries = await Promise.all(
        output.results.map((item) =>
          prisma.foodHistory.create({
            data: {
              userId,
              grams: item.grams,
              foodType: item.foodName, // ✅ gunain foodName dari hasil Python
              carbohydrates: item.carbohydrates,
              protein: item.protein,
              fat: item.fat,
              calories: item.calories,
              date: new Date(),
              imageUrl: `/uploads/${fileName}`,
            },
          })
        )
      );

      res.json({
        message: 'Analisis dan simpan data berhasil',
        data: entries,
      });
    } catch (e) {
      console.error('❌ Gagal parse hasil Python:', e.message);
      res.status(500).json({ error: 'Gagal memproses hasil analisis gambar' });
    }
  });
};
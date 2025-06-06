import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const postFoodHistory = async (req, res) => {
  const userId = req.user.id;
  const { foodName, grams } = req.body;

  if (!foodName || !grams) {
    return res.status(400).json({ error: 'foodName dan grams wajib diisi' });
  }

  try {
    const food = await prisma.food.findFirst({
      where: {
        foodType: {
          equals: foodName,
          mode: 'insensitive',
        },
      },
    });

    if (!food) {
      return res.status(404).json({ error: 'Makanan tidak ditemukan' });
    }

    const newHistory = await prisma.foodHistory.create({
      data: {
        userId,
        foodId: food.id,
        grams,
        date: new Date(),
      },
      include: {
        food: true,
      },
    });

    res.status(201).json({
      message: 'Histori makanan berhasil ditambahkan',
      data: newHistory,
    });
  } catch (err) {
    console.error('❌ Gagal menambahkan histori makanan:', err.message);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

export const getDailyNutritionProgress = async (req, res) => {
  const { id } = req.user;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: id },
    });

    const [todayHistory, yesterdayHistory] = await Promise.all([
      prisma.foodHistory.findMany({
        where: {
          userId: id,
          date: {
            gte: today,
          },
        },
        include: { food: true },
      }),
      prisma.foodHistory.findMany({
        where: {
          userId: id,
          date: {
            gte: yesterday,
            lt: today,
          },
        },
        include: { food: true },
      }),
    ]);

    const totalToday = todayHistory.reduce((sum, h) => {
      return sum + (h.food.calories * h.grams) / 100;
    }, 0);

    const totalYesterday = yesterdayHistory.reduce((sum, h) => {
      return sum + (h.food.calories * h.grams) / 100;
    }, 0);

    res.json({
      today: {
        totalCalories: Math.round(totalToday),
        foodHistory: todayHistory,
      },
      yesterday: {
        totalCalories: Math.round(totalYesterday),
        foodHistory: yesterdayHistory,
      },
      progress: {
        recommended: profile.recommendedCalories,
        custom: profile.customCalories,
        percentOfRecommended: profile.recommendedCalories
          ? Math.min(
              100,
              Math.round((totalToday / profile.recommendedCalories) * 100)
            )
          : null,
        percentOfCustom: profile.customCalories
          ? Math.min(
              100,
              Math.round((totalToday / profile.customCalories) * 100)
            )
          : null,
      },
    });
  } catch (err) {
    console.error('❌ Error saat ambil daily nutrition:', err.message);
    res.status(500).json({ error: 'Gagal mengambil data harian' });
  }
};

// Ambil semua riwayat makanan sejak awal
export const getAllFoodHistory = async (req, res) => {
  const { firebaseUid } = req.user;

  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid },
      include: {
        histories: {
          orderBy: { date: 'asc' },
          include: { food: true }, // PENTING
        },
      },
    });

    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

    const allRecords = user.histories.map((h) => ({
      date: h.date.toISOString().split('T')[0],
      food: { name: h.food.foodType }, // ⬅️ GUNAKAN food.foodType
      grams: h.grams,
      calories: parseFloat(((h.grams / 100) * h.food.calories).toFixed(2)),
    }));

    const totalCalories = allRecords.reduce((sum, r) => sum + r.calories, 0);

    res.json({
      userId: user.id,
      totalCalories,
      records: allRecords,
    });
  } catch (err) {
    console.error('❌ Error di getAllFoodHistory:', err.message);
    res.status(500).json({ error: 'Gagal mengambil riwayat makanan' });
  }
};

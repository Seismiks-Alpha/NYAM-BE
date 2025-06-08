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

    // 🔥 TAMBAHKAN POIN
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayPointLog = await prisma.dailyPoint.findFirst({
      where: {
        userId,
        date: {
          gte: today,
        },
        type: 'food_log',
      },
    });

    if (!todayPointLog || todayPointLog.count < 2) {
      const increment = 5;
      await prisma.user.update({
        where: { id: userId },
        data: {
          points: { increment },
        },
      });

      if (todayPointLog) {
        await prisma.dailyPoint.update({
          where: { id: todayPointLog.id },
          data: {
            count: { increment: 1 },
          },
        });
      } else {
        await prisma.dailyPoint.create({
          data: {
            userId,
            date: new Date(),
            type: 'food_log',
            count: 1,
          },
        });
      }
    }

    res.status(201).json({
      message: 'Histori makanan berhasil ditambahkan & poin ditambahkan!',
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
          date: { gte: today },
        },
        include: { food: true },
      }),
      prisma.foodHistory.findMany({
        where: {
          userId: id,
          date: { gte: yesterday, lt: today },
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

    const recommended = profile.recommendedCalories;
    const custom = profile.customCalories;

    const percentOfRecommended = recommended
      ? Math.min(100, Math.round((totalToday / recommended) * 100))
      : null;
    const percentOfCustom = custom
      ? Math.min(100, Math.round((totalToday / custom) * 100))
      : null;

    // ✅ Perhitungan poin dari progress kalori
    const targetCalories = custom ?? recommended;
    let bonusPoint = 0;

    if (targetCalories && totalToday > 0) {
      const ratio = totalToday / targetCalories;

      if (ratio >= 0.9 && ratio <= 1.1) {
        bonusPoint = 20;
      } else if (ratio >= 0.75 && ratio < 0.9) {
        bonusPoint = 15;
      } else if (ratio > 1.1 && ratio <= 1.25) {
        bonusPoint = 15;
      } else if (ratio >= 0.5 && ratio < 0.75) {
        bonusPoint = 10;
      } else if (ratio > 1.25 && ratio <= 1.5) {
        bonusPoint = 10;
      } else {
        bonusPoint = 5;
      }

      // ✅ Cek apakah sudah pernah dikasih bonus hari ini
      const existing = await prisma.dailyPoint.findFirst({
        where: {
          userId: id,
          date: { gte: today },
          type: 'calorie_goal',
        },
      });

      if (!existing) {
        await prisma.dailyPoint.create({
          data: {
            userId: id,
            type: 'calorie_goal',
            date: new Date(),
            count: 1,
          },
        });

        await prisma.user.update({
          where: { id },
          data: { points: { increment: bonusPoint } },
        });
      }
    }

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
        recommended,
        custom,
        percentOfRecommended,
        percentOfCustom,
        pointEarnedToday: bonusPoint,
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

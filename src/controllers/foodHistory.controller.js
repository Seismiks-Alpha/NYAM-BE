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
          date: {
            gte: today,
          },
        },
      }),
      prisma.foodHistory.findMany({
        where: {
          userId: id,
          date: {
            gte: yesterday,
            lt: today,
          },
        },
      }),
    ]);

    const sumCalories = (arr) =>
      arr.reduce((sum, h) => sum + (h.calories * h.grams) / 100, 0);

    res.json({
      today: {
        totalCalories: Math.round(sumCalories(todayHistory)),
        foodHistory: todayHistory.map((h) => ({
          ...h,
          food: {
            foodType: h.foodType,
            portionSize: 100,
            carbohydrates: h.carbohydrates,
            protein: h.protein,
            fat: h.fat,
            calories: h.calories,
          },
        })),
      },
      yesterday: {
        totalCalories: Math.round(sumCalories(yesterdayHistory)),
        foodHistory: yesterdayHistory.map((h) => ({
          ...h,
          food: {
            foodType: h.foodType,
            portionSize: 100,
            carbohydrates: h.carbohydrates,
            protein: h.protein,
            fat: h.fat,
            calories: h.calories,
          },
        })),
      },
      progress: {
        recommended: profile?.recommendedCalories,
        custom: profile?.customCalories,
        percentOfRecommended: profile?.recommendedCalories
          ? Math.min(100, Math.round((sumCalories(todayHistory) / profile.recommendedCalories) * 100))
          : null,
        percentOfCustom: profile?.customCalories
          ? Math.min(100, Math.round((sumCalories(todayHistory) / profile.customCalories) * 100))
          : null,
      },
    });
  } catch (err) {
    console.error('❌ Error saat ambil daily nutrition:', err.message);
    res.status(500).json({ error: 'Gagal mengambil data harian' });
  }
};


export const getAllFoodHistory = async (req, res) => {
  const { id: userId } = req.user;

  try {
    const histories = await prisma.foodHistory.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });

    const allRecords = histories.map((h) => ({
      date: h.date.toISOString().split('T')[0],
      food: {
        name: h.foodType,
        portionSize: 100,
        carbohydrates: h.carbohydrates,
        protein: h.protein,
        fat: h.fat,
        calories: h.calories,
      },
      grams: h.grams,
      calories: parseFloat(((h.grams / 100) * h.calories).toFixed(2)),
    }));

    const totalCalories = allRecords.reduce((sum, r) => sum + r.calories, 0);

    res.json({
      userId,
      totalCalories,
      records: allRecords,
    });
  } catch (err) {
    console.error('❌ Error di getAllFoodHistory:', err.message);
    res.status(500).json({ error: 'Gagal mengambil riwayat makanan' });
  }
};

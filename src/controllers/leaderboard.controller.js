import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getLeaderboard = async (req, res) => {
  const userId = req.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    // ✅ Ambil semua user dengan total poin mereka
    const allUsers = await prisma.user.findMany({
      orderBy: { points: 'desc' },
      select: {
        id: true,
        displayName: true,
        points: true,
      },
    });

    // ✅ Ambil top 5
    const top5 = allUsers.slice(0, 5).map((user, index) => ({
      rank: index + 1,
      fullname: user.displayName,
      points: user.points,
    }));

    // ✅ Cari posisi user saat ini
    const userRank = allUsers.findIndex((u) => u.id === userId) + 1;
    const currentUser = allUsers.find((u) => u.id === userId);

    // ✅ Cek apakah sudah pernah diberi bonus top 5 hari ini
    const alreadyRewarded = await prisma.dailyPoint.findFirst({
      where: {
        userId,
        date: { gte: today },
        type: 'top5_bonus',
      },
    });

    if (!alreadyRewarded && userRank <= 5) {
      const bonus = 6 - userRank; // Rank 1 => 5, Rank 2 => 4, ..., Rank 5 => 1

      // Simpan bonus dan update poin
      await prisma.dailyPoint.create({
        data: {
          userId,
          type: 'top5_bonus',
          date: new Date(),
          count: 1,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { points: { increment: bonus } },
      });
    }

    res.json({
      top5,
      currentUser: {
        fullname: currentUser.displayName,
        rank: userRank,
        points: currentUser.points,
      },
    });
  } catch (err) {
    console.error('❌ Gagal ambil leaderboard:', err.message);
    res.status(500).json({ error: 'Gagal ambil data leaderboard' });
  }
};

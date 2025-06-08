import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getProfile = async (req, res) => {
  const firebaseUid = req.params.id;

  if (firebaseUid !== req.user.firebaseUid) {
    return res
      .status(403)
      .json({ error: 'Tidak diizinkan melihat data user lain' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid },
      include: { profile: true },
    });

    if (!user || !user.profile) {
      return res.status(404).json({ error: 'Profil tidak ditemukan' });
    }

    res.json({
      email: user.email,
      displayName: user.displayName,
      profile: user.profile,
    });
  } catch (err) {
    console.error('❌ Gagal ambil profil:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

export const getOwnProfile = async (req, res) => {
  const firebaseUid = req.user.firebaseUid;

  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid },
      include: { profile: true },
    });

    if (!user || !user.profile) {
      return res.status(404).json({ error: 'Profil tidak ditemukan' });
    }

    res.json({
      email: user.email,
      displayName: user.displayName,
      photoUrl: user.photoUrl,
      profile: user.profile,
    });
  } catch (err) {
    console.error('❌ Gagal ambil profil:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

export const syncUser = async (req, res) => {
  const { firebaseUid, email, name, photoUrl } = req.user;

  try {
    let user = await prisma.user.findUnique({
      where: { firebaseUid },
      include: { profile: true },
    });

    if (!user) {
      // First time login
      const defaultWeight = 60;
      const defaultHeight = 170;
      const defaultAge = 21;

      const heightInMeters = defaultHeight / 100;
      const bmi = defaultWeight / (heightInMeters * heightInMeters);
      const recommendedCalories = Math.round(24 * defaultWeight * 1.55); // moderat aktif

      user = await prisma.user.create({
        data: {
          firebaseUid,
          email,
          displayName: name || email.split('@')[0],
          photoUrl: photoUrl || null,
          profile: {
            create: {
              weight: defaultWeight,
              height: defaultHeight,
              age: defaultAge,
              gender: 'unknown',
              recommendedCalories,
              customCalories: recommendedCalories,
            },
          },
        },
        include: { profile: true },
      });
    } else {
      await prisma.user.update({
        where: { firebaseUid },
        data: { photoUrl: photoUrl || null },
      });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { firebaseUid },
      include: { profile: true },
    });

    res.json({
      message: '✅ User disinkronkan & foto profil diperbarui',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        photoUrl: updatedUser.photoUrl,
        profile: {
          ...updatedUser.profile,
          recommendedCalories: updatedUser.profile.recommendedCalories,
          customCalories: updatedUser.profile.customCalories,
        },
      },
    });
  } catch (err) {
    console.error('❌ Gagal sync user:', err);
    res.status(500).json({ error: 'Gagal menyinkronkan user' });
  }
};

export const updateOwnProfile = async (req, res) => {
  const firebaseUid = req.user.firebaseUid;
  const { age, weight, height, gender, displayName, customCalories } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    // ✅ Update displayName jika dikirim
    if (displayName) {
      await prisma.user.update({
        where: { firebaseUid },
        data: { displayName },
      });
    }

    // ✅ Hitung BMI dan rekomendasi kalori
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    const recommendedCalories = Math.round(24 * weight * 1.55); // Aktivitas moderat

    // ✅ Update profil dan simpan customCalories jika dikirim, jika tidak pakai default
    const updatedProfile = await prisma.profile.update({
      where: { userId: user.id },
      data: {
        age,
        weight,
        height,
        gender,
        recommendedCalories,
        customCalories: customCalories || recommendedCalories,
      },
    });

    const refreshedUser = await prisma.user.findUnique({
      where: { firebaseUid },
      include: { profile: true },
    });

    res.json({
      message: 'Profil berhasil diperbarui',
      displayName: refreshedUser.displayName,
      profile: refreshedUser.profile,
    });
  } catch (err) {
    console.error('❌ Gagal update profil:', err);
    res.status(500).json({ error: 'Gagal memperbarui profil' });
  }
};

export const loginWithEmail = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    // Cek apakah sudah login hari ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastLogin = user.lastLoginDate;
    const isSameDay =
      lastLogin && new Date(lastLogin).getTime() >= today.getTime();

    // Jika belum login hari ini, tambahkan poin +10 dan update lastLoginDate
    if (!isSameDay) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          points: { increment: 10 },
          lastLoginDate: new Date(),
        },
      });
    }

    // Ambil data terbaru user setelah update poin
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { profile: true },
    });

    res.json({
      message: '✅ Login berhasil',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        points: updatedUser.points,
        profile: updatedUser.profile,
      },
    });
  } catch (err) {
    console.error('❌ Gagal login:', err.message);
    res.status(500).json({ error: 'Gagal login' });
  }
};

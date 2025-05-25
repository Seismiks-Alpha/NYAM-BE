// ✅ 4. user.controller.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getProfile = async (req, res) => {
  const firebaseUid = req.params.id;

  // Pastikan user hanya akses datanya sendiri
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
  const { firebaseUid, email, name, photoUrl } = req.user; // diambil dari middleware

  try {
    let user = await prisma.user.findUnique({
      where: { firebaseUid },
      include: { profile: true },
    });

    if (!user) {
      // 🔰 Pertama kali login
      user = await prisma.user.create({
        data: {
          firebaseUid,
          email,
          displayName: name || email.split('@')[0],
          photoUrl: photoUrl || null,
          profile: {
            create: {
              weight: 60,
              height: 170,
              age: 21,
              gender: 'unknown',
            },
          },
        },
        include: { profile: true },
      });
    } else {
      // 🔁 Sudah ada, update foto profil saja
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
        profile: updatedUser.profile,
      },
    });
  } catch (err) {
    console.error('❌ Gagal sync user:', err);
    res.status(500).json({ error: 'Gagal menyinkronkan user' });
  }
};

export const updateOwnProfile = async (req, res) => {
  const firebaseUid = req.user.firebaseUid;
  const { age, weight, height, gender } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    const updatedProfile = await prisma.profile.update({
      where: { userId: user.id },
      data: { age, weight, height, gender },
    });

    res.json({
      message: '✅ Profil berhasil diperbarui',
      profile: updatedProfile,
    });
  } catch (err) {
    console.error('❌ Gagal update profil:', err);
    res.status(500).json({ error: 'Gagal memperbarui profil' });
  }
};

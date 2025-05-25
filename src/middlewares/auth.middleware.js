// ✅ Middleware untuk verifikasi token Firebase & auto-buat user
import admin from '../firebase.js'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token tidak ditemukan' })
  }

  const idToken = authHeader.split(' ')[1]

  try {
    const decoded = await admin.auth().verifyIdToken(idToken)
    const { uid, email, name, picture } = decoded // picture = photoURL

    let user = await prisma.user.findUnique({
      where: { firebaseUid: uid },
      include: { profile: true }
    })

    if (!user) {
      // ✅ Jika user belum ada → buat user + profil
      user = await prisma.user.create({
        data: {
          email,
          firebaseUid: uid,
          displayName: name || email.split('@')[0],
          photoUrl: picture || null,
          profile: {
            create: {
              weight: 60,
              height: 170,
              age: 21,
              gender: 'unknown'
            }
          }
        },
        include: { profile: true }
      })
    } else {
      // ✅ Jika user sudah ada → update photoUrl dari Google/Firebase
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          photoUrl: picture || user.photoUrl
        },
        include: { profile: true }
      })

      // ✅ Jika user belum punya profil → buat profil default
      if (!user.profile) {
        const createdProfile = await prisma.profile.create({
          data: {
            userId: user.id,
            weight: 60,
            height: 170,
            age: 21,
            gender: 'unknown'
          }
        })

        user.profile = createdProfile
      }
    }

    // ✅ Simpan user info ke request untuk controller
    req.user = {
      id: user.id,
      firebaseUid: uid,
      name: user.displayName,
      photoUrl: user.photoUrl
    }

    next()
  } catch (err) {
    console.error('❌ Token Firebase tidak valid:', err.message)
    return res.status(401).json({ error: 'Token tidak valid' })
  }
}

// prisma/deleteAllFoodData.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 1. Hapus semua histori makanan (harus duluan)
  await prisma.foodHistory.deleteMany({});
  console.log('🗑️ Semua foodHistory berhasil dihapus');

  // 2. Baru hapus semua data makanan
  await prisma.food.deleteMany({});
  console.log('🗑️ Semua data makanan berhasil dihapus');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Gagal menghapus data:', err);
  process.exit(1);
});

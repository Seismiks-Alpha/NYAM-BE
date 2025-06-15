import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const deleted = await prisma.foodHistory.deleteMany({});
  console.log(`✅ ${deleted.count} food history dihapus.`);
}

main()
  .catch((e) => {
    console.error('❌ Error saat hapus data:', e.message);
  })
  .finally(() => prisma.$disconnect());

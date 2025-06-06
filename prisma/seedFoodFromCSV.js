import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';

const prisma = new PrismaClient();

async function main() {
  const foods = [];

  fs.createReadStream('prisma/food_data_averaged_100g.csv')
    .pipe(csv())
    .on('data', (row) => {
      const { food_type, portion_size, carbohydrates, protein, fat, calories } =
        row;

      if (
        food_type &&
        !isNaN(portion_size) &&
        !isNaN(carbohydrates) &&
        !isNaN(protein) &&
        !isNaN(fat) &&
        !isNaN(calories)
      ) {
        foods.push({
          foodType: food_type,
          portionSize: parseInt(portion_size),
          carbohydrates: parseFloat(carbohydrates),
          protein: parseFloat(protein),
          fat: parseFloat(fat),
          calories: parseInt(calories),
        });
      }
    })
    .on('end', async () => {
      try {
        for (const food of foods) {
          await prisma.food.create({ data: food });
        }
        console.log(
          `✅ Berhasil menambahkan ${foods.length} makanan ke database.`
        );
      } catch (err) {
        console.error('❌ Gagal saat memasukkan data:', err);
      } finally {
        await prisma.$disconnect();
      }
    });
}

main().catch((e) => {
  console.error('❌ Error utama:', e);
  prisma.$disconnect();
});

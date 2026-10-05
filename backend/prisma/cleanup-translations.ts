process.loadEnvFile();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/tcc?schema=public";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const booths = await prisma.booth.findMany();
  let count = 0;
  for (const booth of booths) {
    let translations = (booth.translations as any) || {};
    // If we have a ta translation and it's identical to the original English text
    if (translations.ta && translations.ta.name === booth.name) {
      delete translations.ta; // Remove the incorrect English "translation"
      
      await prisma.booth.update({
        where: { id: booth.id },
        data: { translations }
      });
      count++;
    }
  }
  console.log(`Cleaned up ${count} booths that were incorrectly translated as English.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

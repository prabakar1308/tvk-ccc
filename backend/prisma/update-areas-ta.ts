process.loadEnvFile();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { translateAreaToTamil } from '../src/i18n/area-translations';

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:pgadmin1234@localhost:5432/tcc?schema=public";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Updating Unions areasCovered Tamil translations in DB ---');
  const unions = await prisma.union.findMany();

  for (const union of unions) {
    if (union.areasCovered && union.areasCovered.length > 0) {
      const currentTranslations = (union.translations as any) || {};
      const taTranslations = currentTranslations.ta || {};
      const properTaAreas = union.areasCovered.map((a: string) => translateAreaToTamil(a));

      console.log(`\nUnion: "${union.name}"`);
      console.log(`Original areas:`, union.areasCovered);
      console.log(`Updated Tamil areas:`, properTaAreas);

      const newTranslations = {
        ...currentTranslations,
        ta: {
          ...taTranslations,
          areasCovered: properTaAreas,
        },
      };

      await prisma.union.update({
        where: { id: union.id },
        data: { translations: newTranslations },
      });
      console.log(`✅ Updated union "${union.name}" successfully.`);
    }
  }

  const updated = await prisma.union.findMany({
    select: { id: true, name: true, areasCovered: true, translations: true },
  });
  console.log('\nFinal DB state:');
  console.log(JSON.stringify(updated, null, 2));
}

main()
  .catch((e) => {
    console.error('❌ Update failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

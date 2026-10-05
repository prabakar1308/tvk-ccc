process.loadEnvFile();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { translate } from '@vitalets/google-translate-api';

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/tcc?schema=public";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Helper to delay between requests to avoid rate limits (Increased to 2s)
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function translateText(text: string): Promise<string | null> {
  if (!text) return null;
  try {
    const res = await translate(text, { to: 'ta' });
    return res.text;
  } catch (error) {
    console.error(`Error translating "${text}":`, error);
    return null; // return null if translation fails so we don't save English text
  }
}

async function main() {
  console.log('Starting automated Tamil translation script...');

  // 1. Translate Districts
  const districts = await prisma.district.findMany();
  console.log(`Found ${districts.length} districts.`);
  for (const district of districts) {
    let translations = (district.translations as any) || {};
    if (!translations.ta) {
      console.log(`Translating District: ${district.name}`);
      const taName = await translateText(district.name);
      
      if (taName) {
        translations.ta = { name: taName };
        await prisma.district.update({
          where: { id: district.id },
          data: { translations }
        });
        await delay(2000); // 2s delay to respect translation API rate limit
      }
    }
  }

  // 2. Translate Unions
  const unions = await prisma.union.findMany();
  console.log(`Found ${unions.length} unions.`);
  for (const union of unions) {
    let translations = (union.translations as any) || {};
    if (!translations.ta) {
      console.log(`Translating Union: ${union.name}`);
      const taName = await translateText(union.name);
      
      if (taName) {
        translations.ta = { name: taName };
        await prisma.union.update({
          where: { id: union.id },
          data: { translations }
        });
        await delay(2000);
      }
    }
  }

  // 3. Translate Kilais
  const kilais = await prisma.kilai.findMany();
  console.log(`Found ${kilais.length} kilais.`);
  for (const kilai of kilais) {
    let translations = (kilai.translations as any) || {};
    if (!translations.ta) {
      console.log(`Translating Kilai: ${kilai.name}`);
      const taName = await translateText(kilai.name);
      
      if (taName) {
        translations.ta = { name: taName };
        
        if (kilai.description) {
          translations.ta.description = await translateText(kilai.description);
          await delay(2000);
        }
        
        await prisma.kilai.update({
          where: { id: kilai.id },
          data: { translations }
        });
        await delay(2000);
      }
    }
  }

  // 4. Translate Booths
  const booths = await prisma.booth.findMany();
  console.log(`Found ${booths.length} booths.`);
  for (const booth of booths) {
    let translations = (booth.translations as any) || {};
    if (!translations.ta) {
      console.log(`Translating Booth: ${booth.name}`);
      const taName = await translateText(booth.name);
      
      if (taName) {
        translations.ta = { name: taName };
        await prisma.booth.update({
          where: { id: booth.id },
          data: { translations }
        });
        await delay(2000);
      }
    }
  }

  console.log('✅ Automated translation script completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

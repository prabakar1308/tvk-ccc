process.loadEnvFile();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/tcc?schema=public";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function escapeCsv(value: string | null | undefined): string {
  if (!value) return '';
  const str = String(value);
  // If the string contains quotes, commas, or newlines, it must be enclosed in quotes
  // and inner quotes must be escaped as double quotes ("")
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function main() {
  console.log('Starting export of records for translation...');
  
  const csvRows: string[] = [];
  // CSV Header
  csvRows.push('ModelType,ID,EnglishName,TamilName');

  // 1. Export Districts
  const districts = await prisma.district.findMany();
  for (const district of districts) {
    const translations = (district.translations as any) || {};
    const taName = translations.ta?.name || '';
    csvRows.push(`District,${district.id},${escapeCsv(district.name)},${escapeCsv(taName)}`);
  }
  console.log(`Exported ${districts.length} Districts.`);

  // 2. Export Unions
  const unions = await prisma.union.findMany();
  for (const union of unions) {
    const translations = (union.translations as any) || {};
    const taName = translations.ta?.name || '';
    csvRows.push(`Union,${union.id},${escapeCsv(union.name)},${escapeCsv(taName)}`);
  }
  console.log(`Exported ${unions.length} Unions.`);

  // 3. Export Kilais
  const kilais = await prisma.kilai.findMany();
  for (const kilai of kilais) {
    const translations = (kilai.translations as any) || {};
    const taName = translations.ta?.name || '';
    csvRows.push(`Kilai,${kilai.id},${escapeCsv(kilai.name)},${escapeCsv(taName)}`);
  }
  console.log(`Exported ${kilais.length} Kilais.`);

  // 4. Export Booths
  const booths = await prisma.booth.findMany();
  for (const booth of booths) {
    const translations = (booth.translations as any) || {};
    const taName = translations.ta?.name || '';
    csvRows.push(`Booth,${booth.id},${escapeCsv(booth.name)},${escapeCsv(taName)}`);
  }
  console.log(`Exported ${booths.length} Booths.`);

  // Write to file
  const outputPath = path.join(__dirname, 'translations-export.csv');
  fs.writeFileSync(outputPath, csvRows.join('\n'), 'utf-8');
  
  console.log(`\n✅ Successfully exported all data to: ${outputPath}`);
  console.log('You can now open this CSV in Excel, fill out the TamilName column, and save it!');
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

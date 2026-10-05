process.loadEnvFile();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/tcc?schema=public";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Zero-dependency CSV line parser
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

async function main() {
  const csvPath = path.join(__dirname, 'translations-export-tamil.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found at: ${csvPath}`);
    console.log('Please make sure you have run the export script and saved the file as translations-export.csv');
    process.exit(1);
  }

  console.log('Reading CSV file...');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = fileContent.split(/\r?\n/).filter(line => line.trim() !== '');
  
  // Skip header
  const dataLines = lines.slice(1);
  console.log(`Found ${dataLines.length} records to process.`);

  let successCount = 0;

  for (let i = 0; i < dataLines.length; i++) {
    const row = parseCsvLine(dataLines[i]);
    if (row.length < 4) continue;

    const [modelType, id, englishName, tamilName] = row;

    // Only update if a Tamil name was provided
    if (!tamilName || tamilName.trim() === '') {
      continue;
    }

    try {
      // Look up the existing record to get its current translations object
      let currentTranslations: any = {};
      
      switch (modelType) {
        case 'District':
          const d = await prisma.district.findUnique({ where: { id } });
          if (d) currentTranslations = d.translations || {};
          currentTranslations.ta = { ...currentTranslations.ta, name: tamilName };
          await prisma.district.update({ where: { id }, data: { translations: currentTranslations } });
          break;
          
        case 'Union':
          const u = await prisma.union.findUnique({ where: { id } });
          if (u) currentTranslations = u.translations || {};
          currentTranslations.ta = { ...currentTranslations.ta, name: tamilName };
          await prisma.union.update({ where: { id }, data: { translations: currentTranslations } });
          break;
          
        case 'Kilai':
          const k = await prisma.kilai.findUnique({ where: { id } });
          if (k) currentTranslations = k.translations || {};
          currentTranslations.ta = { ...currentTranslations.ta, name: tamilName };
          await prisma.kilai.update({ where: { id }, data: { translations: currentTranslations } });
          break;
          
        case 'Booth':
          const b = await prisma.booth.findUnique({ where: { id } });
          if (b) currentTranslations = b.translations || {};
          currentTranslations.ta = { ...currentTranslations.ta, name: tamilName };
          await prisma.booth.update({ where: { id }, data: { translations: currentTranslations } });
          break;
          
        default:
          console.warn(`Unknown model type: ${modelType} for ID ${id}`);
          break;
      }
      
      successCount++;
    } catch (error) {
      console.error(`Error updating ${modelType} with ID ${id}:`, error);
    }
  }

  console.log(`\n✅ Successfully updated ${successCount} records with Tamil translations from the CSV!`);
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

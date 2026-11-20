import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Default to Cloud SQL proxy port 5433 or environment variable
const uatConnectionString =
  process.env.UAT_DATABASE_URL ||
  process.env.DATABASE_URL_UAT ||
  'postgresql://tcc_user:tcc_db_password_123!@localhost:5433/tcc_db?schema=public';

async function runUatMigration() {
  console.log('====================================================');
  console.log('🚀 Running UAT Database Migration');
  console.log('Connecting to:', uatConnectionString.replace(/:[^:@]+@/, ':****@'));
  console.log('====================================================');

  const adapter = new PrismaPg({ connectionString: uatConnectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const sqlFilePath = path.join(__dirname, 'cadre_gender_position_migration.sql');
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`Migration SQL file not found at: ${sqlFilePath}`);
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
    console.log(`\nExecuting migration script: ${path.basename(sqlFilePath)}...`);

    // Execute the migration script statements
    await prisma.$executeRawUnsafe(sqlContent);
    console.log('✅ Migration SQL executed successfully!');

    // Verification
    console.log('\n--- Verifying Cadre columns in UAT Database ---');
    const cols: Array<{ column_name: string; data_type: string; column_default: string }> =
      await prisma.$queryRawUnsafe(`
        SELECT column_name, data_type, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'Cadre' AND column_name IN ('gender', 'position', 'panchayat', 'village', 'dateOfBirth', 'dob', 'remarks')
        ORDER BY column_name;
      `);

    console.table(cols);

    // Check counts
    const counts: Array<{ total: bigint; default_gender: bigint; default_pos: bigint }> =
      await prisma.$queryRawUnsafe(`
        SELECT 
          COUNT(*)::bigint AS total,
          COUNT(*) FILTER (WHERE gender = 'Male')::bigint AS default_gender,
          COUNT(*) FILTER (WHERE position = 0)::bigint AS default_pos
        FROM "Cadre";
      `);

    if (counts.length > 0) {
      console.log(`Cadre Records Count: Total = ${counts[0].total}, Gender 'Male' = ${counts[0].default_gender}, Position 0 = ${counts[0].default_pos}`);
    }

    console.log('\n🎉 UAT migration completed and verified successfully!');
  } catch (error) {
    console.error('❌ UAT migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runUatMigration();
}

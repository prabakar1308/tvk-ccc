process.loadEnvFile();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

async function alter() {
  const connectionString = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/tcc?schema=public";
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });
  
  await prisma.$executeRawUnsafe(`ALTER TABLE "User" RENAME COLUMN "email" TO "userId"`);
  console.log('Column renamed');
}

alter()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });

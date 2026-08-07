process.loadEnvFile();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

async function drop() {
  const connectionString = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/tcc?schema=public";
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });
  
  await prisma.$executeRawUnsafe(`DELETE FROM "User"`);
  console.log('Users deleted');
}

drop()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });

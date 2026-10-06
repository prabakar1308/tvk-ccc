require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function check() {
  const w = await prisma.wing.findMany();
  console.dir(w.map(wing => ({ name: wing.name, ta: wing.translations?.ta })), { depth: null });
}
check().finally(() => prisma.$disconnect());

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const wings = await prisma.wing.findMany();
  for (let i = 0; i < wings.length; i++) {
    const priority = Math.floor(Math.random() * 10) + 1;
    await prisma.wing.update({
      where: { id: wings[i].id },
      data: { priority },
    });
  }
  console.log('Priorities updated');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

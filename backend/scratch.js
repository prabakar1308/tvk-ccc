const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function run() {
  const unionId = 'a4582ccc-fd52-4e86-8d55-3a18a43a425c';
  
  // Find Prabakaran and update his unionId
  const updated = await prisma.cadre.updateMany({
    where: { name: 'Prabakaran' },
    data: { unionId: unionId }
  });
  
  console.log(`Updated ${updated.count} cadre(s).`);
  
  const cadres = await prisma.cadre.findMany({
    where: { unionId: unionId }
  });
  console.log('Now cadres for South East Union:', cadres.map(c => c.name));
}

run().finally(() => prisma.$disconnect());

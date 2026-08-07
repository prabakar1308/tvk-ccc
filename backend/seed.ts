process.loadEnvFile();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

async function seed() {
  const connectionString = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/tcc?schema=public";
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  const hash = await bcrypt.hash('admin', 10);
  
  await prisma.user.upsert({
    where: { userId: 'admin' },
    update: {
      passwordHash: hash,
      role: 'SUPER_ADMIN'
    },
    create: {
      userId: 'admin',
      passwordHash: hash,
      role: 'SUPER_ADMIN'
    }
  });
  console.log('Admin user created successfully');

  // Seed District
  const district = await prisma.district.upsert({
    where: { name: 'Chennai' },
    update: {},
    create: {
      name: 'Chennai'
    }
  });
  
  // Seed Unions
  const union1 = await prisma.union.upsert({
    where: { name: 'Chennai Central Union' },
    update: {},
    create: {
      name: 'Chennai Central Union',
      districtId: district.id,
      group: 'KURINJIPADI'
    }
  });

  console.log('Unions created successfully:', union1.id);

  // Seed Union Leader
  await prisma.user.upsert({
    where: { userId: 'chennai_leader' },
    update: {
      passwordHash: hash,
      role: 'UNION_LEADER',
      unionId: union1.id
    },
    create: {
      userId: 'chennai_leader',
      passwordHash: hash,
      role: 'UNION_LEADER',
      unionId: union1.id
    }
  });
  console.log('Chennai Union Leader created successfully');
}

seed()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });

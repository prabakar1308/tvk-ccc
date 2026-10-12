process.loadEnvFile();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

async function seed() {
  const connectionString = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/tcc?schema=public";
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  const hash = await bcrypt.hash('admin', 10);
  
  // Create roles
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: { scopeLevel: 'GLOBAL', priority: 1000 },
    create: { name: 'SUPER_ADMIN', isSystem: true, description: 'Super Administrator', scopeLevel: 'GLOBAL', priority: 1000 }
  });

  const unionLeaderRole = await prisma.role.upsert({
    where: { name: 'UNION_LEADER' },
    update: { scopeLevel: 'UNION', priority: 50 },
    create: { name: 'UNION_LEADER', isSystem: true, description: 'Union Leader', scopeLevel: 'UNION', priority: 50 }
  });

  const districtLeaderRole = await prisma.role.upsert({
    where: { name: 'DISTRICT_LEADER' },
    update: { scopeLevel: 'DISTRICT', priority: 100 },
    create: { name: 'DISTRICT_LEADER', isSystem: true, description: 'District Leader', scopeLevel: 'DISTRICT', priority: 100 }
  });
  
  const kilaiLeaderRole = await prisma.role.upsert({
    where: { name: 'KILAI_LEADER' },
    update: { scopeLevel: 'KILAI', priority: 10 },
    create: { name: 'KILAI_LEADER', isSystem: true, description: 'Kilai Leader', scopeLevel: 'KILAI', priority: 10 }
  });
  
  const cadreRole = await prisma.role.upsert({
    where: { name: 'CADRE' },
    update: { scopeLevel: 'GLOBAL', priority: 0 },
    create: { name: 'CADRE', isSystem: true, description: 'Cadre', scopeLevel: 'GLOBAL', priority: 0 }
  });

  const allPermissions = [
    { action: 'users:read', module: 'Users', description: 'Can view users' },
    { action: 'users:write', module: 'Users', description: 'Can manage users' },
    { action: 'users:delete', module: 'Users', description: 'Can delete users' },

    { action: 'cadres:read', module: 'Cadres', description: 'Can view cadres' },
    { action: 'cadres:write', module: 'Cadres', description: 'Can manage cadres' },
    { action: 'cadres:delete', module: 'Cadres', description: 'Can delete cadres' },
    { action: 'cadres:export', module: 'Cadres', description: 'Can export cadres data' },

    { action: 'booths:read', module: 'Booths', description: 'Can view booths' },
    { action: 'booths:write', module: 'Booths', description: 'Can manage booths' },
    { action: 'booths:delete', module: 'Booths', description: 'Can delete booths' },

    { action: 'districts:read', module: 'Districts', description: 'Can view districts' },
    { action: 'districts:write', module: 'Districts', description: 'Can manage districts' },
    { action: 'districts:delete', module: 'Districts', description: 'Can delete districts' },

    { action: 'unions:read', module: 'Unions', description: 'Can view unions' },
    { action: 'unions:write', module: 'Unions', description: 'Can manage unions' },
    { action: 'unions:delete', module: 'Unions', description: 'Can delete unions' },

    { action: 'kilais:read', module: 'Kilais', description: 'Can view kilais' },
    { action: 'kilais:write', module: 'Kilais', description: 'Can manage kilais' },
    { action: 'kilais:delete', module: 'Kilais', description: 'Can delete kilais' },

    { action: 'wings:read', module: 'Wings', description: 'Can view wings' },
    { action: 'wings:write', module: 'Wings', description: 'Can manage wings' },
    { action: 'wings:delete', module: 'Wings', description: 'Can delete wings' },

    { action: 'dashboard:view', module: 'Dashboard', description: 'Can view dashboard metrics' },
    
    { action: 'settings:view', module: 'Settings', description: 'Can view settings page' },
    { action: 'settings:update', module: 'Settings', description: 'Can modify application settings' },

    { action: 'reports:view', module: 'Reports', description: 'Can view reports' },
    { action: 'reports:export', module: 'Reports', description: 'Can export reports' }
  ];

  for (const perm of allPermissions) {
    const createdPerm = await prisma.permission.upsert({
      where: { action: perm.action },
      update: {},
      create: perm
    });
    
    // Assign to SUPER_ADMIN
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: createdPerm.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: createdPerm.id }
    });
  }

  // Seed District
  const district = await prisma.district.upsert({
    where: { name: 'Cuddalore' },
    update: {},
    create: { name: 'Cuddalore' }
  });
  
  // Seed the District Secretary Cadre first
  const cadreId = '9d62c18c-ce62-4565-b7ce-362284abbc87';
  const superAdminCadre = await prisma.cadre.upsert({
    where: { id: cadreId },
    update: {
      role: 'District Secretary',
      level: 'DISTRICT',
      districtId: district.id
    },
    create: {
      id: cadreId,
      memberId: 'TVK-0000001',
      name: 'District Secretary',
      phone: '9999999999',
      role: 'District Secretary',
      level: 'DISTRICT',
      districtId: district.id
    }
  });

  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  
  const superAdminUser = await prisma.user.upsert({
    where: { userId: 'admin' },
    update: {
      passwordHash: adminPasswordHash,
      roleId: superAdminRole.id,
      cadreId: superAdminCadre.id
    },
    create: {
      userId: 'admin',
      passwordHash: adminPasswordHash,
      roleId: superAdminRole.id,
      cadreId: superAdminCadre.id
    }
  });
  console.log('Super Admin user created and linked to District Secretary Cadre successfully');
}

seed()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });

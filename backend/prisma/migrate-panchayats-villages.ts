process.loadEnvFile();
import { PrismaClient, PanchayatType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  MASTER_AREAS_DATA,
  translateAreaToTamil,
  normalizeAreaKey,
} from '../src/i18n/area-translations';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:pgadmin1234@localhost:5432/tcc?schema=public';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// High-precision coordinates and polygons for major revenue panchayats
const KNOWN_GEO_DATA: Record<
  string,
  {
    center: [number, number];
    boundaryCoords?: [number, number][];
    description?: string;
  }
> = {
  karaikadu: {
    center: [11.69038, 79.74372],
    boundaryCoords: [
      [11.6995, 79.7345],
      [11.6992, 79.738],
      [11.6988, 79.742],
      [11.6984, 79.7455],
      [11.6988, 79.7485],
      [11.6955, 79.748],
      [11.6915, 79.747],
      [11.6865, 79.746],
      [11.6815, 79.7455],
      [11.6785, 79.7445],
      [11.6792, 79.7405],
      [11.6805, 79.7368],
      [11.685, 79.736],
      [11.6905, 79.735],
      [11.6955, 79.7345],
      [11.6995, 79.7345],
    ],
    description:
      'Coastal Panchayat in South East Union with strong grassroots presence.',
  },
  semmankuppam: {
    center: [11.64736, 79.73884],
    boundaryCoords: [
      [11.6585, 79.732],
      [11.657, 79.736],
      [11.6552, 79.7398],
      [11.6538, 79.742],
      [11.6522, 79.7438],
      [11.6495, 79.7452],
      [11.6465, 79.7458],
      [11.644, 79.7455],
      [11.6428, 79.7428],
      [11.6412, 79.7458],
      [11.6385, 79.7472],
      [11.6355, 79.746],
      [11.6328, 79.7418],
      [11.6338, 79.737],
      [11.6348, 79.733],
      [11.636, 79.728],
      [11.6368, 79.723],
      [11.6385, 79.7188],
      [11.6415, 79.7158],
      [11.6435, 79.7175],
      [11.645, 79.7215],
      [11.649, 79.725],
      [11.653, 79.728],
      [11.6565, 79.7305],
      [11.6585, 79.732],
    ],
    description:
      'Revenue Village on State Highway 32 bounded by Uppanar River.',
  },
  sedapalayam: {
    center: [11.724, 79.742],
    boundaryCoords: [
      [11.734, 79.736],
      [11.7335, 79.743],
      [11.731, 79.7485],
      [11.726, 79.749],
      [11.719, 79.7475],
      [11.716, 79.743],
      [11.7175, 79.737],
      [11.723, 79.7345],
      [11.729, 79.734],
      [11.734, 79.736],
    ],
    description: 'Sedapalayam Revenue Village in Cuddalore Union.',
  },
  kudikadu: {
    center: [11.69955, 79.76237],
    boundaryCoords: [
      [11.707, 79.755],
      [11.7075, 79.765],
      [11.704, 79.771],
      [11.696, 79.7715],
      [11.691, 79.7665],
      [11.6915, 79.757],
      [11.698, 79.754],
      [11.707, 79.755],
    ],
    description: 'Kudikadu coastal village and industrial belt.',
  },
};

// Known hamlets with coordinates
const KNOWN_VILLAGE_COORDS: Record<string, [number, number]> = {
  karaikadu: [11.69038, 79.74372],
  'ak karaikkadu': [11.6925, 79.7415],
  'ak karaikadu': [11.6925, 79.7415],
  pillaiyarmedu: [11.6835, 79.742],
  chinnapillaiyarmedu: [11.6835, 79.742],
  seethakuppam: [11.6815, 79.7375],
  'k.pudur': [11.6955, 79.7445],
  kpudur: [11.6955, 79.7445],
  kannarappettai: [11.6885, 79.7365],
  kudikadu: [11.69955, 79.76237],
  sothikkuppam: [11.7125, 79.774],
  pachaiyanguppam: [11.718, 79.769],
  sedapalayam: [11.724, 79.742],
  semmankuppam: [11.64736, 79.73884],
};

async function main() {
  console.log('🚀 === STARTING PANCHAYATS & VILLAGES DATABASE MIGRATION ===');

  const unions = await prisma.union.findMany({
    include: {
      kilais: true,
      panchayats: true,
    },
  });

  console.log(`Found ${unions.length} Org Units (Unions) in the database.\n`);

  let totalPanchayatsCreated = 0;
  let totalVillagesCreated = 0;

  // 1. Process each Union and its areasCovered
  for (const union of unions) {
    console.log(`Processing Union: "${union.name}" (Type: ${union.unitType})`);
    const areas = union.areasCovered || [];

    for (const rawArea of areas) {
      if (!rawArea || !rawArea.trim()) continue;
      const areaName = rawArea.trim();
      const normKey = normalizeAreaKey(areaName);

      // Check if already in DB
      let panchayat = await prisma.panchayat.findFirst({
        where: {
          unionId: union.id,
          OR: [
            { name: { equals: areaName, mode: 'insensitive' } },
            { nameTa: { equals: areaName } },
            { code: normKey },
          ],
        },
      });

      // Determine Type and Ward Number
      const isWard = /ward|வார்டு/i.test(areaName);
      const isTown =
        union.unitType === 'TOWN' || union.unitType === 'TOWN_PANCHAYAT';
      const wardMatch = areaName.match(/\d+/);
      const wardNumber = isWard && wardMatch ? parseInt(wardMatch[0], 10) : null;

      let pType: PanchayatType = PanchayatType.VILLAGE_PANCHAYAT;
      if (isWard || isTown) {
        pType =
          union.unitType === 'TOWN'
            ? PanchayatType.MUNICIPALITY_WARD
            : PanchayatType.TOWN_PANCHAYAT_WARD;
      }

      const nameTa = translateAreaToTamil(areaName);
      const geoInfo = KNOWN_GEO_DATA[normKey];

      if (!panchayat) {
        panchayat = await prisma.panchayat.create({
          data: {
            name: areaName,
            nameTa: nameTa,
            code: normKey,
            type: pType,
            wardNumber: wardNumber,
            centerLat: geoInfo ? geoInfo.center[0] : null,
            centerLng: geoInfo ? geoInfo.center[1] : null,
            boundary: geoInfo?.boundaryCoords ? (geoInfo.boundaryCoords as any) : undefined,
            description: geoInfo?.description || null,
            unionId: union.id,
          },
        });
        totalPanchayatsCreated++;
        console.log(`  + Created Panchayat: "${panchayat.name}" (${panchayat.nameTa}) [${pType}]`);
      }
    }
  }

  console.log(`\n✅ Step 1 Complete: Total Panchayats in DB: ${totalPanchayatsCreated}`);

  // 2. Link existing Kilais to Panchayats and create/link Villages
  console.log('\n--- Step 2: Linking Kilais & Creating Villages ---');
  const allKilais = await prisma.kilai.findMany({
    include: {
      union: true,
      villagesRel: true,
      booths: true,
    },
  });

  console.log(`Found ${allKilais.length} Kilais to analyze.`);
  let kilaisLinked = 0;

  for (const kilai of allKilais) {
    const unionId = kilai.unionId;
    let targetPanchayat: any = null;

    // A. Match Kilai's existing panchayat string
    if (kilai.panchayat) {
      const pName = kilai.panchayat.trim();
      const normKey = normalizeAreaKey(pName);

      targetPanchayat = await prisma.panchayat.findFirst({
        where: {
          unionId,
          OR: [
            { name: { equals: pName, mode: 'insensitive' } },
            { nameTa: { equals: pName } },
            { code: normKey },
          ],
        },
      });
    }

    // B. Fallback: match by kilai name
    if (!targetPanchayat) {
      const kNorm = normalizeAreaKey(kilai.name);
      targetPanchayat = await prisma.panchayat.findFirst({
        where: {
          unionId,
          OR: [
            { code: { contains: kNorm } },
            { name: { contains: kilai.name, mode: 'insensitive' } },
          ],
        },
      });
    }

    // Update Kilai panchayatId if matched
    if (targetPanchayat) {
      await prisma.kilai.update({
        where: { id: kilai.id },
        data: { panchayatId: targetPanchayat.id },
      });
      kilaisLinked++;
    }

    // C. Process villages string array on Kilai
    const rawVillages = kilai.villages || [];
    const villageNamesToLink = new Set<string>();

    for (const v of rawVillages) {
      if (v && v.trim()) villageNamesToLink.add(v.trim());
    }
    // Also include kilai name itself if it represents a hamlet
    if (kilai.name && !villageNamesToLink.size) {
      villageNamesToLink.add(kilai.name.trim());
    }

    if (targetPanchayat && villageNamesToLink.size > 0) {
      for (const vName of villageNamesToLink) {
        const vNorm = normalizeAreaKey(vName);

        // Find or create Village under this Panchayat
        let village = await prisma.village.findFirst({
          where: {
            panchayatId: targetPanchayat.id,
            OR: [
              { name: { equals: vName, mode: 'insensitive' } },
              { code: vNorm },
            ],
          },
        });

        const vCoords = KNOWN_VILLAGE_COORDS[vNorm];

        if (!village) {
          village = await prisma.village.create({
            data: {
              name: vName,
              nameTa: translateAreaToTamil(vName),
              code: vNorm,
              centerLat: vCoords ? vCoords[0] : targetPanchayat.centerLat,
              centerLng: vCoords ? vCoords[1] : targetPanchayat.centerLng,
              panchayatId: targetPanchayat.id,
            },
          });
          totalVillagesCreated++;
          console.log(`    + Created Village: "${village.name}" under Panchayat "${targetPanchayat.name}"`);
        }

        // Link Kilai to Village (Many-to-Many)
        await prisma.kilai.update({
          where: { id: kilai.id },
          data: {
            villagesRel: {
              connect: { id: village.id },
            },
          },
        });
      }
    }
  }

  console.log(`✅ Step 2 Complete: ${kilaisLinked} Kilais linked to Panchayats, ${totalVillagesCreated} Villages created.`);

  // 3. Link Booths to Panchayats and Unions
  console.log('\n--- Step 3: Associating Booths to Panchayats and Unions ---');
  const allBooths = await prisma.booth.findMany({
    include: {
      kilais: {
        include: {
          panchayatRel: true,
          villagesRel: true,
        },
      },
    },
  });

  console.log(`Found ${allBooths.length} Polling Booths.`);
  let boothsUpdated = 0;

  for (const booth of allBooths) {
    let assignedPanchayatId: string | null = booth.panchayatId || null;
    let assignedUnionId: string | null = booth.unionId || null;

    // If booth has linked kilais, derive from them
    if (booth.kilais && booth.kilais.length > 0) {
      const primaryKilai = booth.kilais[0];
      if (!assignedUnionId && primaryKilai.unionId) {
        assignedUnionId = primaryKilai.unionId;
      }
      if (!assignedPanchayatId && primaryKilai.panchayatId) {
        assignedPanchayatId = primaryKilai.panchayatId;
      }
    }

    // Fallback: match strictly by booth.area (exact or normalized match, avoid matching postal addresses in school name)
    if (!assignedPanchayatId && booth.area) {
      const bAreaNorm = normalizeAreaKey(booth.area);
      const allPanchayats = await prisma.panchayat.findMany();
      for (const p of allPanchayats) {
        const pNorm = normalizeAreaKey(p.name);
        if (
          bAreaNorm === pNorm ||
          booth.area.trim().toLowerCase() === p.name.trim().toLowerCase() ||
          booth.area.trim() === p.nameTa.trim()
        ) {
          assignedPanchayatId = p.id;
          assignedUnionId = p.unionId;
          break;
        }
      }
    }

    if (assignedPanchayatId || assignedUnionId) {
      await prisma.booth.update({
        where: { id: booth.id },
        data: {
          panchayatId: assignedPanchayatId || undefined,
          unionId: assignedUnionId || undefined,
        },
      });
      boothsUpdated++;
    }
  }

  console.log(`✅ Step 3 Complete: ${boothsUpdated} Booths mapped to Panchayats/Unions.`);

  // Summary counts
  const finalPanchayats = await prisma.panchayat.count();
  const finalVillages = await prisma.village.count();
  const finalKilaisWithP = await prisma.kilai.count({ where: { panchayatId: { not: null } } });
  const finalBoothsWithP = await prisma.booth.count({ where: { panchayatId: { not: null } } });

  console.log('\n================ FINAL MIGRATION SUMMARY ================');
  console.log(`Total Panchayats / Wards in DB: ${finalPanchayats}`);
  console.log(`Total Villages / Hamlets in DB: ${finalVillages}`);
  console.log(`Kilais connected to Panchayats: ${finalKilaisWithP}`);
  console.log(`Booths mapped to Panchayats: ${finalBoothsWithP}`);
  console.log('=========================================================\n');
}

main()
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

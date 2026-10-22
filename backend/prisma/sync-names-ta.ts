process.loadEnvFile();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { translatePersonNameToTamil, translateRoleToTamil } from '../src/i18n/name-translations';
import { translateOrgUnitNameToTamil } from '../src/i18n/org-unit-translations';

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:pgadmin1234@localhost:5432/tcc?schema=public";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Synchronizing Union Names, Contacts & Cadres to Tamil in Database ---');

  // 1. Update Union Names & Contact Names
  const unions = await prisma.union.findMany();
  console.log(`Found ${unions.length} unions.`);
  for (const union of unions) {
    const currentTranslations = (union.translations as any) || {};
    const taTranslations = currentTranslations.ta || {};
    const taName = translateOrgUnitNameToTamil(union.name);
    const taContact = union.contactName ? translatePersonNameToTamil(union.contactName) : taTranslations.contactName;

    console.log(`Union "${union.name}" -> "${taName}", Contact: "${union.contactName}" -> "${taContact}"`);

    await prisma.union.update({
      where: { id: union.id },
      data: {
        translations: {
          ...currentTranslations,
          ta: {
            ...taTranslations,
            name: taName,
            ...(taContact ? { contactName: taContact } : {}),
          },
        },
      },
    });
  }

  // 2. Update Cadres
  const cadres = await prisma.cadre.findMany();
  console.log(`\nFound ${cadres.length} cadres.`);
  for (const cadre of cadres) {
    const currentTranslations = (cadre.translations as any) || {};
    const taTranslations = currentTranslations.ta || {};
    const taName = translatePersonNameToTamil(cadre.name);
    const taRole = cadre.role ? translateRoleToTamil(cadre.role) : null;

    console.log(`Cadre "${cadre.name}" (${cadre.role || 'Member'}) -> "${taName}" (${taRole || ''})`);

    await prisma.cadre.update({
      where: { id: cadre.id },
      data: {
        translations: {
          ...currentTranslations,
          ta: {
            ...taTranslations,
            name: taName,
            ...(taRole ? { role: taRole } : {}),
          },
        },
      },
    });
  }

  // 3. Update Kilais
  const kilais = await prisma.kilai.findMany();
  console.log(`\nFound ${kilais.length} kilais.`);
  for (const kilai of kilais) {
    const currentTranslations = (kilai.translations as any) || {};
    const taTranslations = currentTranslations.ta || {};
    const taSec = kilai.secretaryName ? translatePersonNameToTamil(kilai.secretaryName) : taTranslations.secretaryName;

    if (taSec) {
      console.log(`Kilai "${kilai.name}" Secretary: "${kilai.secretaryName}" -> "${taSec}"`);
      await prisma.kilai.update({
        where: { id: kilai.id },
        data: {
          translations: {
            ...currentTranslations,
            ta: {
              ...taTranslations,
              ...(taSec ? { secretaryName: taSec } : {}),
            },
          },
        },
      });
    }
  }

  console.log('\n✅ Names synchronization completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Sync failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

const WINGS_DATA = [
  { name: 'Information Technology Wing', iconName: 'Monitor', color: 'bg-blue-500', textColor: 'text-blue-500', translations: { ta: { name: 'தகவல் தொழில்நுட்ப அணி' } } },
  { name: 'Advocate / Legal Wing', iconName: 'Scale', color: 'bg-slate-700', textColor: 'text-slate-700', translations: { ta: { name: 'வழக்கறிஞர் அணி' } } },
  { name: 'Media Wing', iconName: 'Radio', color: 'bg-red-500', textColor: 'text-red-500', translations: { ta: { name: 'ஊடக அணி' } } },
  { name: 'Speakers Wing', iconName: 'Mic', color: 'bg-orange-500', textColor: 'text-orange-500', translations: { ta: { name: 'பேச்சாளர் அணி' } } },
  { name: 'Training & Cadre Development Wing', iconName: 'GraduationCap', color: 'bg-indigo-500', textColor: 'text-indigo-500', translations: { ta: { name: 'பயிற்சி மற்றும் தொண்டர் மேம்பாட்டு அணி' } } },
  { name: 'Membership Enrolment Wing', iconName: 'Users', color: 'bg-emerald-500', textColor: 'text-emerald-500', translations: { ta: { name: 'உறுப்பினர் சேர்க்கை அணி' } } },
  { name: 'Climate Research & Environment Wing', iconName: 'TreePine', color: 'bg-green-600', textColor: 'text-green-600', translations: { ta: { name: 'சுற்றுச்சூழல் மற்றும் காலநிலை ஆராய்ச்சி அணி' } } },
  { name: 'Historic Data Research & Factcheck Wing', iconName: 'History', color: 'bg-amber-600', textColor: 'text-amber-600', translations: { ta: { name: 'வரலாற்று தரவு ஆராய்ச்சி மற்றும் உண்மை சரிபார்ப்பு அணி' } } },
  { name: 'Transgenders Wing', iconName: 'Rainbow', color: 'bg-fuchsia-500', textColor: 'text-fuchsia-500', translations: { ta: { name: 'திருநங்கையர் அணி' } } },
  { name: 'Differently Abled Wing', iconName: 'HeartHandshake', color: 'bg-teal-500', textColor: 'text-teal-500', translations: { ta: { name: 'மாற்றுத்திறனாளிகள் அணி' } } },
  { name: 'Youth Wing', iconName: 'Zap', color: 'bg-yellow-500', textColor: 'text-yellow-500', translations: { ta: { name: 'இளைஞர் அணி' } } },
  { name: 'Students Wing', iconName: 'BookOpen', color: 'bg-sky-500', textColor: 'text-sky-500', translations: { ta: { name: 'மாணவர் அணி' } } },
  { name: 'Women Wing', iconName: 'UserRound', color: 'bg-pink-500', textColor: 'text-pink-500', translations: { ta: { name: 'மகளிர் அணி' } } },
  { name: 'Young Women Wing', iconName: 'UserPlus', color: 'bg-rose-400', textColor: 'text-rose-400', translations: { ta: { name: 'இளம் பெண்கள் அணி' } } },
  { name: 'Children Wing', iconName: 'Baby', color: 'bg-lime-500', textColor: 'text-lime-500', translations: { ta: { name: 'சிறுவர் அணி' } } },
  { name: 'Cadre Wing', iconName: 'Shield', color: 'bg-slate-600', textColor: 'text-slate-600', translations: { ta: { name: 'தொண்டர் அணி' } } },
  { name: 'Traders Wing', iconName: 'Store', color: 'bg-violet-500', textColor: 'text-violet-500', translations: { ta: { name: 'வர்த்தகர் அணி' } } },
  { name: 'Fishermen Wing', iconName: 'Sailboat', color: 'bg-cyan-500', textColor: 'text-cyan-500', translations: { ta: { name: 'மீனவர் அணி' } } },
  { name: 'Weavers Wing', iconName: 'Scissors', color: 'bg-purple-500', textColor: 'text-purple-500', translations: { ta: { name: 'நெசவாளர் அணி' } } },
  { name: 'Retired Govt Employees Wing', iconName: 'Briefcase', color: 'bg-stone-500', textColor: 'text-stone-500', translations: { ta: { name: 'ஓய்வுபெற்ற அரசு ஊழியர் அணி' } } },
  { name: 'Labourers Wing', iconName: 'HardHat', color: 'bg-amber-700', textColor: 'text-amber-700', translations: { ta: { name: 'தொழிலாளர் அணி' } } },
  { name: 'Entrepreneurs Wing', iconName: 'Lightbulb', color: 'bg-yellow-600', textColor: 'text-yellow-600', translations: { ta: { name: 'தொழில்முனைவோர் அணி' } } },
  { name: 'Non-Resident of India Wing', iconName: 'Globe', color: 'bg-blue-600', textColor: 'text-blue-600', translations: { ta: { name: 'வெளிநாடு வாழ் இந்தியர் அணி' } } },
  { name: 'Doctors Wing', iconName: 'Stethoscope', color: 'bg-red-400', textColor: 'text-red-400', translations: { ta: { name: 'மருத்துவர் அணி' } } },
  { name: 'Farmers Wing', iconName: 'Wheat', color: 'bg-green-500', textColor: 'text-green-500', translations: { ta: { name: 'விவசாய அணி' } } },
  { name: 'Art, Culture & Tradition Wing', iconName: 'Palette', color: 'bg-fuchsia-600', textColor: 'text-fuchsia-600', translations: { ta: { name: 'கலை, கலாச்சாரம் மற்றும் பாரம்பரிய அணி' } } },
  { name: 'Volunteers Wing (Thondar Ani)', iconName: 'HandHeart', color: 'bg-rose-500', textColor: 'text-rose-500', translations: { ta: { name: 'தொண்டர் அணி' } } },
  { name: 'AITVMI – All India TV Makkal Iyakkam', iconName: 'Tv', color: 'bg-indigo-600', textColor: 'text-indigo-600', translations: { ta: { name: 'அகில இந்திய தளபதி விஜய் மக்கள் இயக்கம்' } } },
];

async function main() {
  console.log('Seeding Wings...');
  for (let i = 0; i < WINGS_DATA.length; i++) {
    const wing = WINGS_DATA[i];
    await prisma.wing.upsert({
      where: { name: wing.name },
      update: {
        color: wing.color,
        textColor: wing.textColor,
        iconName: wing.iconName,
        order: i + 1,
        translations: wing.translations,
      },
      create: {
        name: wing.name,
        color: wing.color,
        textColor: wing.textColor,
        iconName: wing.iconName,
        order: i + 1,
        translations: wing.translations,
      },
    });
  }
  console.log('Wings seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

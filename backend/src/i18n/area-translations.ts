export const KNOWN_AREA_TRANSLATIONS_TA: Record<string, string> = {
  karaikadu: 'காரைக்காடு',
  sedapalayam: 'சேடப்பாளையம்',
  semmangkuppam: 'செம்மங்குப்பம்',
  kudikadu: 'குடிகாடு',
  pachaiyangkuppam: 'பச்சையாங்குப்பம்',
  pachaiyankuppam: 'பச்சையாங்குப்பம்',
  pachchaiyanguppam: 'பச்சையாங்குப்பம்',
  sembadankuppam: 'செம்படாங்குப்பம்',
  kurinjipadi: 'குறிஞ்சிப்பாடி',
  vadalur: 'வடலூர்',
  kullanchavadi: 'குள்ளஞ்சாவடி',
  cuddalore: 'கடலூர்',
  alapakkam: 'ஆலாப்பாக்கம்',
  periyakanganankuppam: 'பெரியகங்கணாங்குப்பம்',
  nayakkankuppam: 'நாயக்கன்குப்பம்',
  thiruchopuram: 'திருச்சோபுரம்',
  kayalpattu: 'காயல்பட்டு',
  periyakuppam: 'பெரியகுப்பம்',
  chinnakuppam: 'சின்னகுப்பம்',
  pettanaickankuppam: 'பெத்தநாயக்கன்குப்பம்',
  madurakudikadu: 'மதுரா குடிகாடு',
  karaikaducolony: 'காரைக்காடு காலனி',
  sedapalayampudur: 'சேடப்பாளையம் புதூர்',
};

export function translateAreaToTamil(area: string): string {
  if (!area || typeof area !== 'string') return area;
  // If already in Tamil script, preserve as is
  if (/[\u0B80-\u0BFF]/.test(area)) return area;

  const key = area.trim().toLowerCase().replace(/[\s\-_]+/g, '');
  if (KNOWN_AREA_TRANSLATIONS_TA[key]) {
    return KNOWN_AREA_TRANSLATIONS_TA[key];
  }

  const plainKey = area.trim().toLowerCase();
  if (KNOWN_AREA_TRANSLATIONS_TA[plainKey]) {
    return KNOWN_AREA_TRANSLATIONS_TA[plainKey];
  }

  return area;
}

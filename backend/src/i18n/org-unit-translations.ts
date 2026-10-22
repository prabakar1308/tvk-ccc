export const KNOWN_ORG_UNIT_TRANSLATIONS_TA: Record<string, string> = {
  // Full names
  'kurinjipadi town': 'குறிஞ்சிப்பாடி நகரம்',
  'kurinjipadi west': 'குறிஞ்சிப்பாடி மேற்கு',
  'kurinjipadi east': 'குறிஞ்சிப்பாடி கிழக்கு',
  'kurinjipadi north': 'குறிஞ்சிப்பாடி வடக்கு',
  'kurinjipadi south': 'குறிஞ்சிப்பாடி தெற்கு',
  'kurinjipadi central': 'குறிஞ்சிப்பாடி மத்திய',
  'kurinjipadi town panchayat': 'குறிஞ்சிப்பாடி பேரூராட்சி',
  'kurinjipadi union': 'குறிஞ்சிப்பாடி ஒன்றியம்',
  'kurinjipadi': 'குறிஞ்சிப்பாடி',

  'south east union': 'தென்கிழக்கு ஒன்றியம்',
  'south west union': 'தென்மேற்கு ஒன்றியம்',
  'north east union': 'வடகிழக்கு ஒன்றியம்',
  'north west union': 'வடமேற்கு ஒன்றியம்',
  'east union': 'கிழக்கு ஒன்றியம்',
  'west union': 'மேற்கு ஒன்றியம்',
  'north union': 'வடக்கு ஒன்றியம்',
  'south union': 'தெற்கு ஒன்றியம்',
  'central union': 'மத்திய ஒன்றியம்',

  'chennai central union': 'சென்னை மத்திய ஒன்றியம்',
  'chennai central': 'சென்னை மத்திய',
  'chennai': 'சென்னை',

  'vadalur town': 'வடலூர் நகரம்',
  'vadalur town panchayat': 'வடலூர் பேரூராட்சி',
  'vadalur union': 'வடலூர் ஒன்றியம்',
  'vadalur north': 'வடலூர் வடக்கு',
  'vadalur south': 'வடலூர் தெற்கு',
  'vadalur east': 'வடலூர் கிழக்கு',
  'vadalur west': 'வடலூர் மேற்கு',
  'vadalur': 'வடலூர்',

  'kullanchavadi town': 'குள்ளஞ்சாவடி நகரம்',
  'kullanchavadi town panchayat': 'குள்ளஞ்சாவடி பேரூராட்சி',
  'kullanchavadi union': 'குள்ளஞ்சாவடி ஒன்றியம்',
  'kullanchavadi': 'குள்ளஞ்சாவடி',

  'cuddalore town': 'கடலூர் நகரம்',
  'cuddalore union': 'கடலூர் ஒன்றியம்',
  'cuddalore east': 'கடலூர் கிழக்கு',
  'cuddalore west': 'கடலூர் மேற்கு',
  'cuddalore north': 'கடலூர் வடக்கு',
  'cuddalore south': 'கடலூர் தெற்கு',
  'cuddalore': 'கடலூர்',

  'test': 'சோதனை',
};

const PLACE_MAP_TA: Record<string, string> = {
  kurinjipadi: 'குறிஞ்சிப்பாடி',
  cuddalore: 'கடலூர்',
  vadalur: 'வடலூர்',
  kullanchavadi: 'குள்ளஞ்சாவடி',
  chennai: 'சென்னை',
  neyveli: 'நெய்வேலி',
  panruti: 'பண்ருட்டி',
  chidambaram: 'சிதம்பரம்',
  bhuvanagiri: 'புவனகிரி',
  kattumannarkoil: 'காட்டுமன்னார்கோயில்',
  virudhachalam: 'விருத்தாசலம்',
  tittagudi: 'திட்டக்குடி',
  srimushnam: 'ஸ்ரீமுஷ்ணம்',
};

const DIRECTION_MAP_TA: Record<string, string> = {
  'south east': 'தென்கிழக்கு',
  'southeast': 'தென்கிழக்கு',
  'south west': 'தென்மேற்கு',
  'southwest': 'தென்மேற்கு',
  'north east': 'வடகிழக்கு',
  'northeast': 'வடகிழக்கு',
  'north west': 'வடமேற்கு',
  'northwest': 'வடமேற்கு',
  'east': 'கிழக்கு',
  'west': 'மேற்கு',
  'north': 'வடக்கு',
  'south': 'தெற்கு',
  'central': 'மத்திய',
};

const UNIT_TYPE_MAP_TA: Record<string, string> = {
  'town panchayat': 'பேரூராட்சி',
  'town': 'நகரம்',
  'union': 'ஒன்றியம்',
  'area': 'பகுதி',
};

function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[\s\-_.,/()]+/g, ' ').trim();
}

/**
 * Translates an Organizational Unit / Union name to Tamil.
 * Examples:
 * - "Kurinjipadi Town" -> "குறிஞ்சிப்பாடி நகரம்"
 * - "South East Union" -> "தென்கிழக்கு ஒன்றியம்"
 * - "West Union" -> "மேற்கு ஒன்றியம்"
 * - "Chennai Central Union" -> "சென்னை மத்திய ஒன்றியம்"
 */
export function translateOrgUnitNameToTamil(name: string): string {
  if (!name || typeof name !== 'string') return name;

  const trimmed = name.trim();

  // If already contains Tamil script, preserve as is
  if (/[\u0B80-\u0BFF]/.test(trimmed)) {
    return trimmed;
  }

  const normalized = normalizeKey(trimmed);

  // Exact known match
  if (KNOWN_ORG_UNIT_TRANSLATIONS_TA[normalized]) {
    return KNOWN_ORG_UNIT_TRANSLATIONS_TA[normalized];
  }

  // Decompose and reconstruct: [Place?] [Direction?] [UnitType?]
  let working = normalized;
  let translatedParts: string[] = [];

  // Check for place prefix
  for (const [placeEn, placeTa] of Object.entries(PLACE_MAP_TA)) {
    if (working.startsWith(placeEn + ' ') || working === placeEn) {
      translatedParts.push(placeTa);
      working = working.slice(placeEn.length).trim();
      break;
    }
  }

  // Check for direction
  for (const [dirEn, dirTa] of Object.entries(DIRECTION_MAP_TA)) {
    if (working.startsWith(dirEn + ' ') || working === dirEn) {
      translatedParts.push(dirTa);
      working = working.slice(dirEn.length).trim();
      break;
    }
  }

  // Check for unit type suffix
  for (const [typeEn, typeTa] of Object.entries(UNIT_TYPE_MAP_TA)) {
    if (working === typeEn || working.endsWith(' ' + typeEn)) {
      translatedParts.push(typeTa);
      working = working.replace(new RegExp(`\\b${typeEn}$`), '').trim();
      break;
    }
  }

  if (translatedParts.length > 0 && working.length === 0) {
    return translatedParts.join(' ');
  }

  return name;
}

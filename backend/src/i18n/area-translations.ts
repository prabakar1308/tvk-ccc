export interface MasterAreaItem {
  english: string;
  tamil: string;
}

export const MASTER_AREAS_DATA: MasterAreaItem[] = [
  { english: 'Thiruvanthipuram', tamil: 'திருவந்திபுரம்' },
  { english: 'Arisi Periyaanguppam', tamil: 'அரிசி பெரியாங்குப்பம்' },
  { english: 'Karaiyerivitta Kuppam', tamil: 'கரையேறிவிட்ட குப்பம்' },
  { english: 'Vellakarai', tamil: 'வெள்ளக்கரை' },
  { english: 'Annavalli', tamil: 'அன்னவல்லி' },
  { english: 'Ramapuram', tamil: 'ராமபுரம்' },
  { english: 'Sedapalayam', tamil: 'சேடபாளையம்' },
  { english: 'Semmanguppam', tamil: 'செம்மங்குப்பம்' },
  { english: 'Kudikadu', tamil: 'குடிகாடு' },
  { english: 'Karaikadu', tamil: 'காரைக்காடு' },
  { english: 'pachayangkuppam', tamil: 'பச்சையாங்குப்பம்' },
  { english: 'CN Palayam', tamil: 'CN பாளையம்' },
  { english: 'Naduveerapattu', tamil: 'நடுவீரப்பட்டு' },
  { english: 'Kumalangkulam', tamil: 'குமலங்குளம்' },
  { english: 'Vilangalpattu', tamil: 'விளங்கல்பட்டு' },
  { english: 'Vanamaadevi', tamil: 'வானமாதேவி' },
  { english: 'Kunamangalam', tamil: 'குணமங்கலம்' },
  { english: 'Kodukavampalayam', tamil: 'கொடுக்கவாம்பாளையம்' },
  { english: 'Pillali', tamil: 'பிலாலி' },
  { english: 'Andarmulipallam', tamil: 'ஆண்டார்முள்ளிபள்ளம்' },
  { english: 'Kayalpattu', tamil: 'காயல்பட்டு' },
  { english: 'Phuvanikuppam', tamil: 'புவனிக்குப்பம்' },
  { english: 'Adhinarayanapuram', tamil: 'ஆதிநாராயணபுரம்' },
  { english: 'Vandiyamballam', tamil: 'வண்டியம்பலம்' },
  { english: 'Alapakkam', tamil: 'அலபாக்கம்' },
  { english: 'Thiruchopuram', tamil: 'திருச்சோபுரம்' },
  { english: 'Thyagavalli', tamil: 'தியாகவல்லி' },
  { english: 'Ambalavanan Pettai', tamil: 'அம்பலவாணன் பேட்டை' },
  { english: 'Vazhalampattu', tamil: 'வாழலாம்பட்டு' },
  { english: 'Thondamanatham', tamil: 'தொண்டமாநத்தம்' },
  { english: 'Kothandaramapuram', tamil: 'கோதண்டராமபுரம்' },
  { english: 'Anukampattu', tamil: 'அனுகம்பட்டு' },
  { english: 'Akaram', tamil: 'அகரம்' },
  { english: 'Krishnakuppam', tamil: 'கிருஷ்ணகுப்பம்' },
  { english: 'Aayikuppam', tamil: 'ஆயிக்குப்பம்' },
  { english: 'T Palayam', tamil: 'T பாளையம்' },
  { english: 'Thambipettai', tamil: 'தம்பிப்பேட்டை' },
  { english: 'Thayalgunampattinam', tamil: 'தையல்குணம்பட்டினம்' },
  { english: 'Kannadi', tamil: 'கண்ணாடி' },
  { english: 'Adur Agaram', tamil: 'ஆடூர் அகரம்' },
  { english: 'Kothavacheri', tamil: 'கொத்தவாச்சேரி' },
  { english: 'Sirupalayayur', tamil: 'சிறுபாலையூர்' },
  { english: 'Kirtanagiri', tamil: 'கீர்த்தனாகிரி' },
  { english: 'Kallayanguppam', tamil: 'கல்லாங்குப்பம்' },
  { english: 'Kundiyamallur', tamil: 'குண்டியமல்லூர்' },
  { english: 'Pettanayakkankuppam', tamil: 'பெட்டநாயக்கன்குப்பம்' },
  { english: 'Viruppachchi', tamil: 'விருப்பாச்சி' },
  { english: 'Renganathapuram', tamil: 'ரெங்கநாதபுரம்' },
  { english: 'Kalgunam', tamil: 'கல்குணம்' },
  { english: 'Kuruvappanpettai', tamil: 'குருவப்பன்பேட்டை' },
  { english: 'Bhootambadi', tamil: 'பூதம்பாடி' },
  { english: 'Kolakudi', tamil: 'கொலக்குடி' },
  { english: 'Karunguzhi', tamil: 'கருங்குழி' },
  { english: 'Maruvai', tamil: 'மருவாய்' },
  { english: 'Arangamangalam', tamil: 'அரங்கமங்கலம்' },
  { english: 'Varadharajanpettai', tamil: 'வரதராஜன்பேட்டை' },
  { english: 'Nainarkuppam', tamil: 'நைனார்குப்பம்' },
  { english: 'Melaputhupettai', tamil: 'மேலபுதுப்பேட்டை' },
  { english: 'Ward', tamil: 'வார்டு' },
];

export function normalizeAreaKey(str: string): string {
  return str.toLowerCase().replace(/[\s\-_.,/()]+/g, '').trim();
}

export const TAMIL_CORRECTIONS: Record<string, string> = {
  'சேடப்பாளையம்': 'சேடபாளையம்',
  'ஆலாப்பாக்கம்': 'அலபாக்கம்',
  'பெத்தநாயக்கன்குப்பம்': 'பெட்டநாயக்கன்குப்பம்',
};

export const KNOWN_AREA_TRANSLATIONS_TA: Record<string, string> = {
  // Common existing aliases
  kurinjipadi: 'குறிஞ்சிப்பாடி',
  vadalur: 'வடலூர்',
  kullanchavadi: 'குள்ளஞ்சாவடி',
  cuddalore: 'கடலூர்',
  sembadankuppam: 'செம்படாங்குப்பம்',
  periyakanganankuppam: 'பெரியகங்கணாங்குப்பம்',
  nayakkankuppam: 'நாயக்கன்குப்பம்',
  periyakuppam: 'பெரியகுப்பம்',
  chinnakuppam: 'சின்னகுப்பம்',
  madurakudikadu: 'மதுரா குடிகாடு',
  karaikaducolony: 'காரைக்காடு காலனி',
  sedapalayampudur: 'சேடபாளையம் புதூர்',

  // Common transliteration variants
  semmangkuppam: 'செம்மங்குப்பம்',
  semmanguppam: 'செம்மங்குப்பம்',
  arisiperiyankuppam: 'அரிசி பெரியாங்குப்பம்',
  arisiperiyaanguppam: 'அரிசி பெரியாங்குப்பம்',
  pachaiyangkuppam: 'பச்சையாங்குப்பம்',
  pachaiyankuppam: 'பச்சையாங்குப்பம்',
  pachchaiyanguppam: 'பச்சையாங்குப்பம்',
  pachayangkuppam: 'பச்சையாங்குப்பம்',
  puvanikuppam: 'புவனிக்குப்பம்',
  phuvanikuppam: 'புவனிக்குப்பம்',
  bhuvanikuppam: 'புவனிக்குப்பம்',
  vandiyampallam: 'வண்டியம்பலம்',
  vandiyamballam: 'வண்டியம்பலம்',
  vandiyambalam: 'வண்டியம்பலம்',
  vandiyampalam: 'வண்டியம்பலம்',
  kumalankulam: 'குமலங்குளம்',
  kumalangkulam: 'குமலங்குளம்',
  vanamadevi: 'வானமாதேவி',
  vanamaadevi: 'வானமாதேவி',
  gunamangalam: 'குணமங்கலம்',
  kunamangalam: 'குணமங்கலம்',
  kodukavampalayam: 'கொடுக்கவாம்பாளையம்',
  pettanaickankuppam: 'பெட்டநாயக்கன்குப்பம்',
  pettanayakkankuppam: 'பெட்டநாயக்கன்குப்பம்',
  viruppachi: 'விருப்பாச்சி',
  viruppachchi: 'விருப்பாச்சி',
  ranganathapuram: 'ரெங்கநாதபுரம்',
  renganathapuram: 'ரெங்கநாதபுரம்',
  bootambadi: 'பூதம்பாடி',
  bhootambadi: 'பூதம்பாடி',
  sirupalayur: 'சிறுபாலையூர்',
  sirupalayayur: 'சிறுபாலையூர்',
  kallayankuppam: 'கல்லாங்குப்பம்',
  kallanguppam: 'கல்லாங்குப்பம்',
  kallayanguppam: 'கல்லாங்குப்பம்',
  andarmullipallam: 'ஆண்டார்முள்ளிபள்ளம்',
  andarmulipallam: 'ஆண்டார்முள்ளிபள்ளம்',
  thayalgunapattinam: 'தையல்குணம்பட்டினம்',
  thayalgunampattinam: 'தையல்குணம்பட்டினம்',
  kothandararnapuram: 'கோதண்டராமபுரம்',
  kothandaramapuram: 'கோதண்டராமபுரம்',
  ambalavananpettai: 'அம்பலவாணன் பேட்டை',
  aduragaram: 'ஆடூர் அகரம்',
  kuruvappanpettai: 'குருவப்பன்பேட்டை',
  varadharajanpettai: 'வரதராஜன்பேட்டை',
  melaputhupettai: 'மேலபுதுப்பேட்டை',
  nainarkuppam: 'நைனார்குப்பம்',
  chennappanayakkanpalayam: 'சென்னப்பநாயக்கன்பாளையம்',
  thirumanikuzhi: 'திருமாணிக்குழி',
  kumarappanayakkanpettai: 'குமரப்பநாயக்கன்பேட்டை',
  thotti: 'தொட்டி',
  otteri: 'ஓட்டேரி',
};

// Add standard wards (1 to 30) to master areas list
for (let i = 1; i <= 30; i++) {
  MASTER_AREAS_DATA.push({
    english: `Ward ${i}`,
    tamil: `வார்டு ${i}`,
  });
}

// Automatically populate dictionary from MASTER_AREAS_DATA
for (const item of MASTER_AREAS_DATA) {
  const normKey = normalizeAreaKey(item.english);
  KNOWN_AREA_TRANSLATIONS_TA[normKey] = item.tamil;
  KNOWN_AREA_TRANSLATIONS_TA[item.english.toLowerCase().trim()] = item.tamil;
}

// Also populate ward variants
for (let i = 1; i <= 100; i++) {
  KNOWN_AREA_TRANSLATIONS_TA[`ward${i}`] = `வார்டு ${i}`;
  KNOWN_AREA_TRANSLATIONS_TA[`ward ${i}`] = `வார்டு ${i}`;
  KNOWN_AREA_TRANSLATIONS_TA[`wardno${i}`] = `வார்டு ${i}`;
  KNOWN_AREA_TRANSLATIONS_TA[`wardno.${i}`] = `வார்டு ${i}`;
}

export function getMasterAreas(): { name: string; nameTa: string }[] {
  return MASTER_AREAS_DATA.map((item) => ({
    name: item.english,
    nameTa: item.tamil,
  }));
}

export function translateAreaToTamil(area: string): string {
  if (!area || typeof area !== 'string') return area;

  const trimmed = area.trim();

  // If there's an explicit correction for a previous Tamil translation
  if (TAMIL_CORRECTIONS[trimmed]) {
    return TAMIL_CORRECTIONS[trimmed];
  }

  // If already in Tamil script and not in corrections, preserve as is
  if (/[\u0B80-\u0BFF]/.test(trimmed)) {
    return trimmed;
  }

  // 1. Exact match on normalized key
  const normKey = normalizeAreaKey(trimmed);
  if (KNOWN_AREA_TRANSLATIONS_TA[normKey]) {
    return KNOWN_AREA_TRANSLATIONS_TA[normKey];
  }

  // 2. Exact match on lowercase key
  const plainKey = trimmed.toLowerCase();
  if (KNOWN_AREA_TRANSLATIONS_TA[plainKey]) {
    return KNOWN_AREA_TRANSLATIONS_TA[plainKey];
  }

  // 3. Match Ward pattern: "Ward 1", "Ward-2", "Ward No. 3", "Ward No 4", "Ward 12", etc.
  const wardRegex = /^ward[\s\-_.]*(?:no\.?|number)?[\s\-_.]*([0-9]+[a-zA-Z]*|[a-zA-Z])$/i;
  const wardMatch = trimmed.match(wardRegex);
  if (wardMatch) {
    return `வார்டு ${wardMatch[1]}`;
  }

  // 4. Match compound Ward pattern: "Kurinjipadi Ward 1" -> "குறிஞ்சிப்பாடி வார்டு 1"
  const compoundWardRegex = /^(.*?)[\s\-_,]+ward[\s\-_.]*(?:no\.?|number)?[\s\-_.]*([0-9]+[a-zA-Z]*|[a-zA-Z])$/i;
  const compoundWardMatch = trimmed.match(compoundWardRegex);
  if (compoundWardMatch) {
    const baseName = translateAreaToTamil(compoundWardMatch[1]);
    return `${baseName} வார்டு ${compoundWardMatch[2]}`;
  }

  // 5. Match Block / Division / Zone patterns
  const blockMatch = trimmed.match(/^block[\s\-_.]*(?:no\.?|number)?[\s\-_.]*([0-9]+[a-zA-Z]*)$/i);
  if (blockMatch) {
    return `பிளாக் ${blockMatch[1]}`;
  }

  const divMatch = trimmed.match(/^division[\s\-_.]*(?:no\.?|number)?[\s\-_.]*([0-9]+[a-zA-Z]*)$/i);
  if (divMatch) {
    return `பிரிவு ${divMatch[1]}`;
  }

  const zoneMatch = trimmed.match(/^zone[\s\-_.]*(?:no\.?|number)?[\s\-_.]*([0-9]+[a-zA-Z]*)$/i);
  if (zoneMatch) {
    return `மண்டலம் ${zoneMatch[1]}`;
  }

  // 6. Match Directional or Suffix modifiers: e.g. "Vadalur North" -> "வடலூர் வடக்கு"
  const suffixMatch = trimmed.match(/^(.*?)\s+(north|south|east|west|central|colony|pudur|nagar)$/i);
  if (suffixMatch) {
    const base = translateAreaToTamil(suffixMatch[1]);
    const modifierMap: Record<string, string> = {
      north: 'வடக்கு',
      south: 'தெற்கு',
      east: 'கிழக்கு',
      west: 'மேற்கு',
      central: 'மத்திய',
      colony: 'காலனி',
      pudur: 'புதூர்',
      nagar: 'நகர்',
    };
    const mod = modifierMap[suffixMatch[2].toLowerCase()];
    if (mod && base !== suffixMatch[1]) {
      return `${base} ${mod}`;
    }
  }

  return area;
}




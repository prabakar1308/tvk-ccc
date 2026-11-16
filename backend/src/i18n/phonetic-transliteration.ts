/**
 * Tamil Nadu Phonetic Transliteration Engine
 * 
 * Specifically designed for Tamil Nadu place names (villages, hamlets, towns, panchayats, unions)
 * and person names. Converts phonetically between Tamil script and English proper noun romanization
 * rather than semantic/literal translation (preventing errors like "பெரியகங்கணகுப்பம்" -> "Big Ganga Group"
 * or "மேல்பாதி" -> "Upper half").
 */

const VIRAMA = '\u0BCD'; // Tamil pulli (்)

const VOWELS: Record<string, string> = {
  '\u0B85': 'a',
  '\u0B86': 'aa',
  '\u0B87': 'i',
  '\u0B88': 'ee',
  '\u0B89': 'u',
  '\u0B8A': 'oo',
  '\u0B8E': 'e',
  '\u0B8F': 'e',
  '\u0B90': 'ai',
  '\u0B92': 'o',
  '\u0B93': 'o',
  '\u0B94': 'au',
};

const VOWEL_SIGNS: Record<string, string> = {
  '\u0BBE': 'a',   // ா (often 'a' in names, e.g. Kanganam, Rajan)
  '\u0BBF': 'i',   // ி
  '\u0BC0': 'ee',  // ீ
  '\u0BC1': 'u',   // ு
  '\u0BC2': 'oo',  // ூ
  '\u0BC6': 'e',   // ெ
  '\u0BC7': 'e',   // ே
  '\u0BC8': 'ai',  // ை
  '\u0BCA': 'o',   // ொ
  '\u0BCB': 'o',   // ோ
  '\u0BCC': 'au',  // ௌ
};

// Known high-frequency Tamil Nadu towns, villages and proper names
const EXACT_TAMIL_TO_ENGLISH: Record<string, string> = {
  'பெரியகங்கணகுப்பம்': 'Periyakanganankuppam',
  'பெரியகங்கணாங்குப்பம்': 'Periyakanganankuppam',
  'சின்னக்கங்கணகுப்பம்': 'Chinnakanganankuppam',
  'சின்னக்கங்கணாங்குப்பம்': 'Chinnakanganankuppam',
  'காரைக்காடு': 'Karaikadu',
  'காரைக்காடு காலனி': 'Karaikadu Colony',
  'விருத்தாசலம்': 'Virudhachalam',
  'விருத்தாச்சலம்': 'Virudhachalam',
  'செந்தில்குமார்': 'Senthilkumar',
  'சீதாக்குப்பம்': 'Seethakuppam',
  'சீதக்குப்பம்': 'Seethakuppam',
  'தொழுதூர்': 'Tholudur',
  'ஆண்டிமடம்': 'Andimadam',
  'விருப்பாச்சி': 'Viruppachchi',
  'வழுதலம்பட்டு': 'Vazhudhalampattu',
  'வாழலாம்பட்டு': 'Vazhalampattu',
  'திருவந்திபுரம்': 'Thiruvanthipuram',
  'சேடபாளையம்': 'Sedapalayam',
  'சேடபாளையம் புதூர்': 'Sedapalayam Pudur',
  'ஆலம்பாடி': 'Alambadi',
  'குமாரமங்கலம்': 'Kumaramangalam',
  'நடுவீரப்பட்டு': 'Naduveerapattu',
  'பெரியகுப்பம்': 'Periyakuppam',
  'சின்னகுப்பம்': 'Chinnakuppam',
  'குறிஞ்சிப்பாடி': 'Kurinjipadi',
  'வடலூர்': 'Vadalur',
  'குள்ளஞ்சாவடி': 'Kullanchavadi',
  'கடலூர்': 'Cuddalore',
  'செம்மங்குப்பம்': 'Semmanguppam',
  'செம்மன்குப்பம்': 'Semmanguppam',
  'பச்சையாங்குப்பம்': 'Pachaiyanguppam',
  'புதுப்பேட்டை': 'Pudupettai',
  'மேலபுதுப்பேட்டை': 'Melaputhupettai',
  'மேல்பாதி': 'Melpathi',
  'கீழ்ப்பாதி': 'Keezhpathi',
  'கீழ்பாதி': 'Keezhpathi',
  'மதுரா குடிகாடு': 'Madurakudikadu',
  'குடிகாடு': 'Kudikadu',
  'அரிசி பெரியாங்குப்பம்': 'Arisi Periyaanguppam',
  'கரையேறிவிட்ட குப்பம்': 'Karaiyerivitta Kuppam',
  'வெள்ளக்கரை': 'Vellakarai',
  'அன்னவல்லி': 'Annavalli',
  'ராமபுரம்': 'Ramapuram',
  'குமலங்குளம்': 'Kumalangkulam',
  'விளங்கல்பட்டு': 'Vilangalpattu',
  'வானமாதேவி': 'Vanamaadevi',
  'குணமங்கலம்': 'Kunamangalam',
  'கொடுக்கவாம்பாளையம்': 'Kodukavampalayam',
  'காயல்பட்டு': 'Kayalpattu',
  'புவனிக்குப்பம்': 'Puvanikuppam',
  'ஆதிநாராயணபுரம்': 'Adhinarayanapuram',
  'வண்டியம்பலம்': 'Vandiyambalam',
  'அலபாக்கம்': 'Alapakkam',
  'திருச்சோபுரம்': 'Thiruchopuram',
  'தியாகவல்லி': 'Thyagavalli',
  'அம்பலவாணன் பேட்டை': 'Ambalavanan Pettai',
  'தொண்டமாநத்தம்': 'Thondamanatham',
  'கோதண்டராமபுரம்': 'Kothandaramapuram',
  'அனுகம்பட்டு': 'Anukampattu',
  'கிருஷ்ணகுப்பம்': 'Krishnakuppam',
  'ஆயிக்குப்பம்': 'Aayikuppam',
  'தம்பிப்பேட்டை': 'Thambipettai',
  'தையல்குணம்பட்டினம்': 'Thayalgunampattinam',
  'கண்ணாடி': 'Kannadi',
  'கொத்தவாச்சேரி': 'Kothavacheri',
  'கல்லாங்குப்பம்': 'Kallayanguppam',
  'குண்டியமல்லூர்': 'Kundiyamallur',
  'பெட்டநாயக்கன்குப்பம்': 'Pettanayakkankuppam',
  'ரெங்கநாதபுரம்': 'Renganathapuram',
  'கல்குணம்': 'Kalgunam',
  'குருவப்பன்பேட்டை': 'Kuruvappanpettai',
  'பூதம்பாடி': 'Bhootambadi',
  'கொலக்குடி': 'Kolakudi',
  'கருங்குழி': 'Karunguzhi',
  'மருவாய்': 'Maruvai',
  'அரங்கமங்கலம்': 'Arangamangalam',
  'வரதராஜன்பேட்டை': 'Varadharajanpettai',
  'நைனார்குப்பம்': 'Nainarkuppam',
};

// Common Tamil Nadu prefixes
const PREFIXES = [
  { ta: 'பெரிய', en: 'Periya' },
  { ta: 'சின்ன', en: 'Chinna' },
  { ta: 'மேல்', en: 'Mel' },
  { ta: 'கீழ்', en: 'Keezh' },
  { ta: 'கீழ', en: 'Keezh' },
  { ta: 'நடு', en: 'Nadu' },
  { ta: 'புது', en: 'Pudu' },
  { ta: 'பழைய', en: 'Pazhaya' },
  { ta: 'வட', en: 'Vada' },
  { ta: 'தென்', en: 'Then' },
  { ta: 'திரு', en: 'Thiru' },
];

// Common Tamil Nadu village and town suffixes
const SUFFIXES = [
  { ta: 'குப்பம்', en: 'kuppam' },
  { ta: 'பாளையம்', en: 'palayam' },
  { ta: 'பட்டி', en: 'patti' },
  { ta: 'பேட்டை', en: 'pettai' },
  { ta: 'மங்கலம்', en: 'mangalam' },
  { ta: 'சேரி', en: 'cheri' },
  { ta: 'கோட்டை', en: 'kottai' },
  { ta: 'புதூர்', en: 'pudur' },
  { ta: 'மேடு', en: 'medu' },
  { ta: 'காடு', en: 'kadu' },
  { ta: 'பட்டு', en: 'pattu' },
  { ta: 'குளம்', en: 'kulam' },
  { ta: 'நகர்', en: 'nagar' },
  { ta: 'புரம்', en: 'puram' },
  { ta: 'மடம்', en: 'madam' },
  { ta: 'பாதி', en: 'pathi' },
  { ta: 'பாடி', en: 'padi' },
  { ta: 'வல்லி', en: 'valli' },
  { ta: 'கரை', en: 'karai' },
  { ta: 'மல்லூர்', en: 'mallur' },
  { ta: 'சாவடி', en: 'chavadi' },
  { ta: 'வாசல்', en: 'vasal' },
  { ta: 'மனை', en: 'manai' },
  { ta: 'நத்தம்', en: 'natham' },
  { ta: 'தோட்டம்', en: 'thottam' },
  { ta: 'குறிச்சி', en: 'kurichi' },
];

/**
 * Phonetically transliterates Tamil text (places, names) into standard English proper noun spelling.
 */
export function transliterateTamilToEnglish(input: string): string {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  // If text doesn't contain Tamil script, return as-is
  if (!/[\u0B80-\u0BFF]/.test(trimmed)) {
    return trimmed;
  }

  // Handle Ward patterns: e.g. "வார்டு 12" -> "Ward 12"
  const wardMatch = trimmed.match(/^வார்டு[\s\-_.]*([0-9]+)$/i);
  if (wardMatch) {
    return `Ward ${wardMatch[1]}`;
  }

  // Exact known table check
  const normalizedKey = trimmed.replace(/\s+/g, ' ');
  if (EXACT_TAMIL_TO_ENGLISH[normalizedKey]) {
    return EXACT_TAMIL_TO_ENGLISH[normalizedKey];
  }

  // Check prefix matches (e.g. பெரியகங்கணகுப்பம் -> Periya + kanganankuppam)
  for (const p of PREFIXES) {
    if (trimmed.startsWith(p.ta)) {
      let remainder = trimmed.slice(p.ta.length).trim();
      // Remove sandhi gemination consonant if present (e.g. க், ச், த், ப்)
      if (
        remainder.length >= 2 &&
        remainder[1] === VIRAMA &&
        ['க்', 'ச்', 'த்', 'ப்'].includes(remainder.slice(0, 2))
      ) {
        remainder = remainder.slice(2);
      }
      if (remainder.length > 0) {
        const transRest = transliterateTamilToEnglish(remainder);
        return p.en + transRest.charAt(0).toLowerCase() + transRest.slice(1);
      }
    }
  }

  // Check suffix matches (e.g. சீதாக்குப்பம் -> Seetha + kuppam)
  for (const s of SUFFIXES) {
    if (trimmed.endsWith(s.ta) && trimmed.length > s.ta.length) {
      let base = trimmed.slice(0, -s.ta.length).trim();
      // Remove trailing pulli sandhi (e.g. சீதாக் -> சீதா)
      if (
        base.endsWith('க்') ||
        base.endsWith('ப்') ||
        base.endsWith('த்') ||
        base.endsWith('ச்')
      ) {
        base = base.slice(0, -2);
      }
      if (base.length > 0) {
        const transBase = transliterateTamilToEnglish(base);
        return transBase + s.en;
      }
    }
  }

  // Syllabic & cluster phonetics parser
  let res = '';
  let i = 0;
  const len = trimmed.length;

  while (i < len) {
    const ch = trimmed[i];
    const n1 = trimmed[i + 1] || '';
    const n2 = trimmed[i + 2] || '';
    const n3 = trimmed[i + 3] || '';

    // Spaces and punctuation
    if (ch === ' ' || ch === '-' || ch === '.' || ch === ',') {
      res += ch;
      i++;
      continue;
    }

    // Independent vowels
    if (VOWELS[ch]) {
      res += VOWELS[ch];
      i++;
      continue;
    }

    // Consonant with virama (pulli)
    if (n1 === VIRAMA) {
      // Geminate consonants: க்+க, ச்+ச, ட்+ட, த்+த, ப்+ப, ற்+ற
      if (ch === '\u0B95' && n2 === '\u0B95') {
        const gem = 'kk';
        if (VOWEL_SIGNS[n3]) {
          res += gem + VOWEL_SIGNS[n3];
          i += 4;
        } else {
          res += gem + 'a';
          i += 3;
        }
        continue;
      }
      if (ch === '\u0B9A' && n2 === '\u0B9A') {
        const gem = 'ch';
        if (VOWEL_SIGNS[n3]) {
          res += gem + VOWEL_SIGNS[n3];
          i += 4;
        } else {
          res += gem + 'a';
          i += 3;
        }
        continue;
      }
      if (ch === '\u0B9F' && n2 === '\u0B9F') {
        const gem = 'tt';
        if (VOWEL_SIGNS[n3]) {
          res += gem + VOWEL_SIGNS[n3];
          i += 4;
        } else {
          res += gem + 'a';
          i += 3;
        }
        continue;
      }
      if (ch === '\u0BA4' && n2 === '\u0BA4') {
        const gem = 'th';
        if (VOWEL_SIGNS[n3]) {
          res += gem + VOWEL_SIGNS[n3];
          i += 4;
        } else {
          res += gem + 'a';
          i += 3;
        }
        continue;
      }
      if (ch === '\u0BAA' && n2 === '\u0BAA') {
        const gem = 'pp';
        if (VOWEL_SIGNS[n3]) {
          res += gem + VOWEL_SIGNS[n3];
          i += 4;
        } else {
          res += gem + 'a';
          i += 3;
        }
        continue;
      }
      if (ch === '\u0BB1' && n2 === '\u0BB1') {
        const gem = 'tr';
        if (VOWEL_SIGNS[n3]) {
          res += gem + VOWEL_SIGNS[n3];
          i += 4;
        } else {
          res += gem + 'a';
          i += 3;
        }
        continue;
      }

      // Nasal + plosive clusters: ங்+க, ஞ்+ச, ண்+ட, ந்+த, ம்+ப, ன்+ற
      let clusterSound: string | null = null;
      if (ch === '\u0B99' && n2 === '\u0B95') clusterSound = 'ng';
      else if (ch === '\u0B9E' && n2 === '\u0B9A') clusterSound = 'nj';
      else if (ch === '\u0BA3' && n2 === '\u0B9F') clusterSound = 'nd';
      else if (ch === '\u0BA8' && n2 === '\u0BA4') clusterSound = 'nth';
      else if (ch === '\u0BAE' && n2 === '\u0BAA') clusterSound = 'mb';
      else if (ch === '\u0BA9' && n2 === '\u0BB1') clusterSound = 'ndr';

      if (clusterSound) {
        if (VOWEL_SIGNS[n3]) {
          res += clusterSound + VOWEL_SIGNS[n3];
          i += 4;
        } else {
          res += clusterSound + 'a';
          i += 3;
        }
        continue;
      }

      // Single muted consonant with virama
      const MUTED: Record<string, string> = {
        '\u0B95': 'k',
        '\u0B99': 'ng',
        '\u0B9A': 's',
        '\u0B9E': 'nj',
        '\u0B9F': 't',
        '\u0BA3': 'n',
        '\u0BA4': 'th',
        '\u0BA8': 'n',
        '\u0BA9': 'n',
        '\u0BAA': 'p',
        '\u0BAE': 'm',
        '\u0BAF': 'y',
        '\u0BB0': 'r',
        '\u0BB1': 'r',
        '\u0BB2': 'l',
        '\u0BB3': 'l',
        '\u0BB4': 'zh',
        '\u0BB5': 'v',
        '\u0BB6': 'sh',
        '\u0BB7': 'sh',
        '\u0BB8': 's',
        '\u0BB9': 'h',
        '\u0B9C': 'j',
      };

      res += MUTED[ch] || '';
      i += 2; // skip consonant and virama
      continue;
    }

    // Normal consonant
    const isAtStart = i === 0 || trimmed[i - 1] === ' ';
    let sound = '';
    switch (ch) {
      case '\u0B95': sound = isAtStart ? 'k' : 'g'; break; // க
      case '\u0B99': sound = 'ng'; break;                  // ங
      case '\u0B9A': sound = isAtStart ? 'ch' : 's'; break;// ச
      case '\u0B9E': sound = 'nj'; break;                  // ஞ
      case '\u0B9F': sound = isAtStart ? 't' : 'd'; break; // ட
      case '\u0BA3': sound = 'n'; break;                   // ண
      case '\u0BA4': sound = 'th'; break;                  // த
      case '\u0BA8': sound = 'n'; break;                   // ந
      case '\u0BA9': sound = 'n'; break;                   // ன
      case '\u0BAA': sound = isAtStart ? 'p' : 'b'; break; // ப
      case '\u0BAE': sound = 'm'; break;                   // ம
      case '\u0BAF': sound = 'y'; break;                   // ய
      case '\u0BB0': sound = 'r'; break;                   // ர
      case '\u0BB1': sound = 'r'; break;                   // ற
      case '\u0BB2': sound = 'l'; break;                   // ல
      case '\u0BB3': sound = 'l'; break;                   // ள
      case '\u0BB4': sound = 'zh'; break;                  // ழ
      case '\u0BB5': sound = 'v'; break;                   // வ
      case '\u0BB6': sound = 'sh'; break;                  // ஶ
      case '\u0BB7': sound = 'sh'; break;                  // ஷ
      case '\u0BB8': sound = 's'; break;                   // ஸ
      case '\u0BB9': sound = 'h'; break;                   // ஹ
      case '\u0B9C': sound = 'j'; break;                   // ஜ
      default: sound = ch; break;
    }

    if (VOWEL_SIGNS[n1]) {
      res += sound + VOWEL_SIGNS[n1];
      i += 2;
    } else {
      res += sound + 'a';
      i++;
    }
  }

  // Capitalize first letter of words
  return res.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

/**
 * Phonetically transliterates English text into Tamil script using Google Input Tools API
 * with automatic caching and network fallback.
 */
const inputToolsCache = new Map<string, string>();

export async function transliterateEnglishToTamil(input: string): Promise<string> {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  // If already Tamil script
  if (/[\u0B80-\u0BFF]/.test(trimmed)) {
    return trimmed;
  }

  const cacheKey = trimmed.toLowerCase();
  if (inputToolsCache.has(cacheKey)) {
    return inputToolsCache.get(cacheKey)!;
  }

  try {
    const url = `https://inputtools.google.com/request?text=${encodeURIComponent(trimmed)}&itc=ta-t-i0-und&num=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data: any = await res.json();
      if (
        Array.isArray(data) &&
        data[0] === 'SUCCESS' &&
        data[1]?.[0]?.[1]?.[0]
      ) {
        const resultTamil = data[1][0][1][0].trim();
        inputToolsCache.set(cacheKey, resultTamil);
        return resultTamil;
      }
    }
  } catch (err: any) {
    // Graceful fallback if offline or request fails
  }

  return trimmed;
}


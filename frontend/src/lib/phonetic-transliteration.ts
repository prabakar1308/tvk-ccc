/**
 * Tamil Nadu Phonetic Transliteration Engine (Client-side)
 *
 * Transliterates Tamil Nadu place names (villages, hamlets, towns, panchayats) and person names
 * phonetically rather than literal machine translation.
 */

const VIRAMA = '\u0BCD';

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
  '\u0BBE': 'a',
  '\u0BBF': 'i',
  '\u0BC0': 'ee',
  '\u0BC1': 'u',
  '\u0BC2': 'oo',
  '\u0BC6': 'e',
  '\u0BC7': 'e',
  '\u0BC8': 'ai',
  '\u0BCA': 'o',
  '\u0BCB': 'o',
  '\u0BCC': 'au',
};

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

export function transliterateTamilToEnglish(input: string): string {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  if (!/[\u0B80-\u0BFF]/.test(trimmed)) {
    return trimmed;
  }

  const wardMatch = trimmed.match(/^வார்டு[\s\-_.]*([0-9]+)$/i);
  if (wardMatch) {
    return `Ward ${wardMatch[1]}`;
  }

  const normalizedKey = trimmed.replace(/\s+/g, ' ');
  if (EXACT_TAMIL_TO_ENGLISH[normalizedKey]) {
    return EXACT_TAMIL_TO_ENGLISH[normalizedKey];
  }

  for (const p of PREFIXES) {
    if (trimmed.startsWith(p.ta)) {
      let remainder = trimmed.slice(p.ta.length).trim();
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

  for (const s of SUFFIXES) {
    if (trimmed.endsWith(s.ta) && trimmed.length > s.ta.length) {
      let base = trimmed.slice(0, -s.ta.length).trim();
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

  let res = '';
  let i = 0;
  const len = trimmed.length;

  while (i < len) {
    const ch = trimmed[i];
    const n1 = trimmed[i + 1] || '';
    const n2 = trimmed[i + 2] || '';
    const n3 = trimmed[i + 3] || '';

    if (ch === ' ' || ch === '-' || ch === '.' || ch === ',') {
      res += ch;
      i++;
      continue;
    }

    if (VOWELS[ch]) {
      res += VOWELS[ch];
      i++;
      continue;
    }

    if (n1 === VIRAMA) {
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
      i += 2;
      continue;
    }

    const isAtStart = i === 0 || trimmed[i - 1] === ' ';
    let sound = '';
    switch (ch) {
      case '\u0B95': sound = isAtStart ? 'k' : 'g'; break;
      case '\u0B99': sound = 'ng'; break;
      case '\u0B9A': sound = isAtStart ? 'ch' : 's'; break;
      case '\u0B9E': sound = 'nj'; break;
      case '\u0B9F': sound = isAtStart ? 't' : 'd'; break;
      case '\u0BA3': sound = 'n'; break;
      case '\u0BA4': sound = 'th'; break;
      case '\u0BA8': sound = 'n'; break;
      case '\u0BA9': sound = 'n'; break;
      case '\u0BAA': sound = isAtStart ? 'p' : 'b'; break;
      case '\u0BAE': sound = 'm'; break;
      case '\u0BAF': sound = 'y'; break;
      case '\u0BB0': sound = 'r'; break;
      case '\u0BB1': sound = 'r'; break;
      case '\u0BB2': sound = 'l'; break;
      case '\u0BB3': sound = 'l'; break;
      case '\u0BB4': sound = 'zh'; break;
      case '\u0BB5': sound = 'v'; break;
      case '\u0BB6': sound = 'sh'; break;
      case '\u0BB7': sound = 'sh'; break;
      case '\u0BB8': sound = 's'; break;
      case '\u0BB9': sound = 'h'; break;
      case '\u0B9C': sound = 'j'; break;
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

  return res.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}


/**
 * Transliterate Devanagari / Hindi lyrics to standard Romanized English (Hinglish)
 * matching Spotify's lyrics display style.
 */

const VOWELS = {
  'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
  'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
  'अं': 'an', 'अँ': 'an', 'अः': 'ah', 'ऑ': 'o', 'ऍ': 'e'
};

const MATRAS = {
  'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo',
  'ृ': 'ri', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
  'ॉ': 'o', 'ॅ': 'e', '्': ''
};

const CONSONANTS = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
  'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
  'क़': 'q', 'ख़': 'kh', 'ग़': 'gh', 'ज़': 'z', 'ड़': 'r', 'ढ़': 'rh', 'फ़': 'f',
  '\u0958': 'q', '\u0959': 'kh', '\u095a': 'gh', '\u095b': 'z',
  '\u095c': 'r', '\u095d': 'rh', '\u095e': 'f'
};

const WORD_POLISH = {
  'haina': 'hain',
  'hain': 'hain',
  'bahate': 'behte',
  'sahate': 'sehte',
  'ham': 'hum',
  'to': 'toh',
  'hue': 'huye',
  'khaud': 'khud',
  'khud': 'khud',
  'badae': 'bade',
  'bade': 'bade',
  'bhee': 'bhi',
  'bhi': 'bhi',
  'hee': 'hi',
  'hi': 'hi',
  'parae': 'paraye',
  'roothe': 'roothe',
  'toote': 'toote',
  'aansoo': 'aansu',
  'aansu': 'aansu',
  'kya': 'kya',
  'kuchha': 'kuch',
  'kuchh': 'kuch',
  'kuch': 'kuch',
  'vo': 'woh',
  'ye': 'yeh',
  'meraa': 'mera',
  'teraa': 'tera',
  'dil': 'dil',
  'pyaar': 'pyaar',
  'ishq': 'ishq',
  'muhabbat': 'mohabbat',
  'najar': 'nazar',
  'lagi': 'lagi',
  'zindagi': 'zindagi',
  'kaisi': 'kaisi',
  'jaane': 'jaane',
  'kyun': 'kyun',
  'kyoon': 'kyun',
  'phir': 'phir',
  'chupa': 'chupa',
  'chhupa': 'chupa',
  'chupake': 'chupaake',
  'likh': 'likh'
};

export function hasDevanagari(text) {
  return /[\u0900-\u097F]/.test(text);
}

export function transliterateWord(word) {
  if (!hasDevanagari(word)) return word;

  let out = '';
  const chars = Array.from(word);
  const len = chars.length;

  for (let i = 0; i < len; i++) {
    const c = chars[i];
    const next = chars[i + 1] || '';

    if (VOWELS[c]) {
      out += VOWELS[c];
      continue;
    }

    if (CONSONANTS[c]) {
      const base = CONSONANTS[c];
      if (MATRAS[next] !== undefined) {
        out += base + MATRAS[next];
        i++;
      } else if (next === '्') {
        out += base;
        i++;
      } else if (next === 'ं' || next === 'ँ') {
        out += base + 'an';
        i++;
      } else {
        const isWordEnd = (i === len - 1);
        out += isWordEnd ? base : (base + 'a');
      }
      continue;
    }

    if (c === 'ं' || c === 'ँ') {
      out += 'n';
      continue;
    }

    if (MATRAS[c]) {
      out += MATRAS[c];
      continue;
    }

    out += c;
  }

  const lower = out.toLowerCase();
  if (WORD_POLISH[lower]) {
    const polished = WORD_POLISH[lower];
    return out.charAt(0) === out.charAt(0).toUpperCase()
      ? polished.charAt(0).toUpperCase() + polished.slice(1)
      : polished;
  }

  return out;
}

export function devanagariToHinglish(text) {
  if (!text || !hasDevanagari(text)) return text;

  let s = text
    .replace(/\u0921\u093c/g, '\u095c') // ड़
    .replace(/\u0922\u093c/g, '\u095d') // ढ़
    .replace(/\u091c\u093c/g, '\u095b') // ज़
    .replace(/\u092b\u093c/g, '\u095e') // फ़
    .replace(/\u0916\u093c/g, '\u0959') // ख़
    .replace(/\u0917\u093c/g, '\u095a') // ग़
    .replace(/\u0915\u093c/g, '\u0958'); // क़

  const tokens = s.split(/(\s+|[.,!?()\"'-]+)/);
  const result = tokens.map(token => {
    if (!token || !hasDevanagari(token)) return token;
    return transliterateWord(token);
  }).join('');

  return result
    .replace(/\ba([.,!?])/gi, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export default devanagariToHinglish;

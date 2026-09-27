import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { romanize } from 'tamil-romanizer';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const cleanRomanize = (text: string) => {
  if (!text) return '';
  try {
    const tamilRegex = /[\u0B80-\u0BFF]/;
    if (tamilRegex.test(text)) {
      let res = romanize(text).toLowerCase();

      // Vowel formatting fixes (iso15919 to standard english)
      res = res.replace(/aa/g, 'a')
               .replace(/ee/g, 'e')
               .replace(/oo/g, 'u')  // soorya -> surya
               .replace(/ii/g, 'i')
               .replace(/uu/g, 'u')
               .replace(/ae/g, 'e')  // kanaesan -> kanesan
               .replace(/oa/g, 'o'); // asoak -> asok

      // Consonant clustering fixes
      res = res.replace(/tth/g, 'th') // kartthigeyan -> karthigeyan
               .replace(/pira/g, 'pra')
               .replace(/thira/g, 'thra')
               .replace(/kira/g, 'kra')
               .replace(/sira/g, 'sra')
               .replace(/kiru/g, 'kri');

      // Common Name Fixes (Tamil phonetics to standard English names)
      res = res.replace(/karthigeyan/g, 'karthikeyan')
               .replace(/kanesan/g, 'ganesan')
               .replace(/kanesh/g, 'ganesh')
               .replace(/kopal/g, 'gopal')
               .replace(/kovind/g, 'govind')
               .replace(/palamurugan/g, 'balamurugan')
               .replace(/palasubrama/g, 'balasubrama')
               .replace(/palakrishnan/g, 'balakrishnan')
               .replace(/palaji/g, 'balaji')
               .replace(/paskaran/g, 'baskaran')
               .replace(/latsumi/g, 'lakshmi')
               .replace(/latchumi/g, 'lakshmi')
               .replace(/minatchi/g, 'meenakshi')
               .replace(/tinesh/g, 'dinesh')
               .replace(/thinesh/g, 'dinesh')
               .replace(/tipak/g, 'deepak')
               .replace(/tivya/g, 'divya')
               .replace(/asok/g, 'ashok')
               .replace(/prabagaran/g, 'prabakaran')
               .replace(/gumar/g, 'kumar')
               .replace(/agash/g, 'akash')
               .replace(/andh/g, 'anth')
               .replace(/kogul/g, 'gokul')
               .replace(/posko/g, 'bosco')
               .replace(/nadan/g, 'nathan')
               .replace(/girushnan/g, 'krishnan')
               .replace(/kirushnan/g, 'krishnan')
               .replace(/kadir/g, 'kathir')
               .replace(/pirem/g, 'prem')
               .replace(/viknesh/g, 'vignesh');

      // Title Case
      res = res.split(/([\s.])/).map((w: any) => {
         if (w === ' ' || w === '.') return w;
         return w.charAt(0).toUpperCase() + w.slice(1);
      }).join('');
      return res;
    }
    return text;
  } catch (e) {
    return text;
  }
};

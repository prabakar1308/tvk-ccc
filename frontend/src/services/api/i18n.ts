import { fetchWithAuth } from './client';

export interface TranslationResponse {
  originalText: string;
  targetLanguage: string;
  translatedText: string;
}

export const i18nApi = {
  translate: async (
    text: string,
    target: 'ta' | 'en',
    source?: 'en' | 'ta',
  ): Promise<string> => {
    const trimmed = (text || '').trim();
    if (!trimmed) return '';

    try {
      const res = await fetchWithAuth('/api/v1/i18n/translate', {
        method: 'POST',
        body: JSON.stringify({ text: trimmed, target, source }),
      });
      if (!res.ok) {
        return '';
      }
      const data: TranslationResponse = await res.json();
      return data.translatedText || '';
    } catch (err) {
      console.warn('Translation API error:', err);
      return '';
    }
  },

  transliterate: async (
    text: string,
    target: 'ta' | 'en',
    source?: 'en' | 'ta',
  ): Promise<string> => {
    const trimmed = (text || '').trim();
    if (!trimmed) return '';

    try {
      const res = await fetchWithAuth('/api/v1/i18n/transliterate', {
        method: 'POST',
        body: JSON.stringify({ text: trimmed, target, source }),
      });
      if (!res.ok) {
        return '';
      }
      const data: TranslationResponse = await res.json();
      return data.translatedText || '';
    } catch (err) {
      console.warn('Transliteration API error:', err);
      return '';
    }
  },
};

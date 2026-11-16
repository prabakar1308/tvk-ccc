import { Injectable, Logger } from '@nestjs/common';
import { translateAreaToTamil, translateAreaToEnglish } from './area-translations';
import { translateOrgUnitNameToTamil, translateOrgUnitNameToEnglish } from './org-unit-translations';
import { translatePersonNameToTamil, translatePersonNameToEnglish } from './name-translations';
import { transliterateTamilToEnglish, transliterateEnglishToTamil } from './phonetic-transliteration';

@Injectable()
export class I18nService {
  private readonly logger = new Logger(I18nService.name);
  private readonly memoryCache = new Map<string, string>();

  /**
   * Decodes common HTML entities returned by Google Translate v2
   */
  private decodeHtmlEntities(text: string): string {
    if (!text) return '';
    return text
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/');
  }

  /**
   * Check in-memory master data dictionaries first
   */
  private checkMasterData(text: string, targetLanguage: string): string | null {
    const trimmed = text.trim();
    if (!trimmed) return '';

    if (targetLanguage === 'ta') {
      // Check org units
      const orgTa = translateOrgUnitNameToTamil(trimmed);
      if (orgTa && orgTa !== trimmed) return orgTa;

      // Check areas
      const areaTa = translateAreaToTamil(trimmed);
      if (areaTa && areaTa !== trimmed) return areaTa;

      // Check person names
      const personTa = translatePersonNameToTamil(trimmed);
      if (personTa && personTa !== trimmed) return personTa;
    } else if (targetLanguage === 'en') {
      // Check org units
      const orgEn = translateOrgUnitNameToEnglish(trimmed);
      if (orgEn && orgEn !== trimmed) return orgEn;

      // Check areas
      const areaEn = translateAreaToEnglish(trimmed);
      if (areaEn && areaEn !== trimmed) return areaEn;

      // Check person names
      const personEn = translatePersonNameToEnglish(trimmed);
      if (personEn && personEn !== trimmed) return personEn;
    }

    return null;
  }

  /**
   * Phonetically transliterates text between English and Tamil.
   * Priority:
   * 1. In-memory cache
   * 2. Master data dictionaries (0ms)
   * 3. Phonetic transliteration engine (Google Input Tools for EN->TA, Syllabic phonetic engine for TA->EN)
   * 4. Google Cloud Translation API (fallback)
   */
  async transliterate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string,
  ): Promise<string> {
    const trimmed = (text || '').trim();
    if (!trimmed) return '';

    if (sourceLanguage && sourceLanguage.toLowerCase() === targetLanguage.toLowerCase()) {
      return trimmed;
    }

    const cacheKey = `translit:${sourceLanguage || 'auto'}:${targetLanguage}:${trimmed.toLowerCase()}`;
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey)!;
    }

    // 1. Try master data dictionaries first
    const masterTranslation = this.checkMasterData(trimmed, targetLanguage);
    if (masterTranslation && masterTranslation !== trimmed) {
      this.memoryCache.set(cacheKey, masterTranslation);
      return masterTranslation;
    }

    // 2. Phonetic transliteration
    if (targetLanguage === 'en') {
      const en = transliterateTamilToEnglish(trimmed);
      if (en && en !== trimmed) {
        this.memoryCache.set(cacheKey, en);
        return en;
      }
    } else if (targetLanguage === 'ta') {
      const ta = await transliterateEnglishToTamil(trimmed);
      if (ta && ta !== trimmed) {
        this.memoryCache.set(cacheKey, ta);
        return ta;
      }
    }

    // 3. Fallback to general translate
    return this.translate(trimmed, targetLanguage, sourceLanguage);
  }

  /**
   * Translates or transliterates text to the target language.
   * For proper nouns (villages, towns, person names), phonetic transliteration is prioritized
   * so semantic literal errors (e.g. "பெரியகங்கணகுப்பம்" -> "Big Ganga Group") are completely avoided.
   */
  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string,
  ): Promise<string> {
    const trimmed = (text || '').trim();
    if (!trimmed) return '';

    // If source and target are the same, return as-is
    if (sourceLanguage && sourceLanguage.toLowerCase() === targetLanguage.toLowerCase()) {
      return trimmed;
    }

    const cacheKey = `${sourceLanguage || 'auto'}:${targetLanguage}:${trimmed.toLowerCase()}`;
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey)!;
    }

    // 1. Try master data dictionaries first
    const masterTranslation = this.checkMasterData(trimmed, targetLanguage);
    if (masterTranslation && masterTranslation !== trimmed) {
      this.memoryCache.set(cacheKey, masterTranslation);
      return masterTranslation;
    }

    // 2. Tamil -> English proper noun phonetic transliteration
    // Prevents Google Translate v2 from translating village names literally
    if (targetLanguage === 'en' && /[\u0B80-\u0BFF]/.test(trimmed)) {
      const phoneticEn = transliterateTamilToEnglish(trimmed);
      if (phoneticEn && phoneticEn !== trimmed) {
        this.memoryCache.set(cacheKey, phoneticEn);
        return phoneticEn;
      }
    }

    // 3. English -> Tamil phonetic transliteration (Google Input Tools)
    if (targetLanguage === 'ta' && !/[\u0B80-\u0BFF]/.test(trimmed)) {
      const phoneticTa = await transliterateEnglishToTamil(trimmed);
      if (phoneticTa && phoneticTa !== trimmed) {
        this.memoryCache.set(cacheKey, phoneticTa);
        return phoneticTa;
      }
    }

    // 4. Call Google Cloud Translation API if API Key is configured
    const apiKey =
      process.env.GOOGLE_TRANSLATION_API_KEY ||
      process.env.GOOGLE_CLOUD_API_KEY ||
      process.env.GOOGLE_API_KEY;

    if (apiKey) {
      try {
        const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey.trim())}`;
        const payload: Record<string, any> = {
          q: [trimmed],
          target: targetLanguage,
          format: 'text',
        };
        if (sourceLanguage) {
          payload.source = sourceLanguage;
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data: any = await response.json();
          const translatedRaw = data?.data?.translations?.[0]?.translatedText;
          if (translatedRaw) {
            const cleaned = this.decodeHtmlEntities(translatedRaw).trim();
            this.memoryCache.set(cacheKey, cleaned);
            this.logger.debug(
              `Google Cloud Translation: "${trimmed}" -> "${cleaned}" (${targetLanguage})`,
            );
            return cleaned;
          }
        } else {
          const errBody = await response.text().catch(() => '');
          this.logger.warn(
            `Google Cloud Translation API returned status ${response.status}: ${errBody}`,
          );
        }
      } catch (err: any) {
        this.logger.error(`Error calling Google Cloud Translation API: ${err.message}`);
      }
    } else {
      this.logger.debug(
        'GOOGLE_TRANSLATION_API_KEY not set. Using master data / transliteration fallback.',
      );
    }

    // 5. Final fallback: return original text
    return trimmed;
  }

  /**
   * Helper to generate a full translations JSON object for a given entity's fields
   */
  async generateTranslationsForEntity(
    fieldsToTranslate: Record<string, string>,
    targetLanguages: string[] = ['ta'],
  ) {
    const translations: Record<string, Record<string, string>> = {};

    for (const lang of targetLanguages) {
      translations[lang] = {};
      for (const [key, value] of Object.entries(fieldsToTranslate)) {
        if (value) {
          translations[lang][key] = await this.translate(value, lang);
        }
      }
    }
    return translations;
  }
}

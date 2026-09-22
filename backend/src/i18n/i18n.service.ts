import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class I18nService {
  private readonly logger = new Logger(I18nService.name);

  /**
   * Translates text to the target language.
   * This is currently a mock service. To implement real AI translation,
   * you can integrate `@google-cloud/translate` or AWS Translate here.
   */
  async translate(text: string, targetLanguage: string): Promise<string> {
    if (!text || targetLanguage === 'en') return text;
    
    this.logger.debug(`Translating "${text}" to ${targetLanguage}`);
    
    // TODO: Replace with real API call
    // e.g. const [translation] = await translate.translate(text, targetLanguage);
    
    // Fallback Mock Translation Logic for prototyping
    if (targetLanguage === 'ta') {
      return `[Tamil: ${text}]`;
    }
    
    return `[${targetLanguage}: ${text}]`;
  }

  /**
   * Helper to generate a full translations JSON object for a given entity's fields
   */
  async generateTranslationsForEntity(fieldsToTranslate: Record<string, string>, targetLanguages: string[] = ['ta']) {
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

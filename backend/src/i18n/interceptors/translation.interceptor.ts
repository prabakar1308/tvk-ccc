import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { translateAreaToTamil } from '../area-translations';

@Injectable()
export class TranslationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    // Use x-lang, Accept-Language header, or query param lang. Default to 'en'.
    let lang = 'en';
    const reqLang =
      request.headers['x-lang'] ||
      request.headers['accept-language'] ||
      request.query?.lang;
    if (reqLang && typeof reqLang === 'string') {
      lang = reqLang.split(',')[0].split('-')[0].trim().toLowerCase();
    }

    return next.handle().pipe(map((data) => this.translateData(data, lang)));
  }

  private translateData(data: any, lang: string): any {
    // Base cases
    if (data === null || data === undefined) return data;
    if (typeof data !== 'object') return data;
    if (data instanceof Date) return data;

    // Handle Arrays (e.g., findAll queries returning multiple records)
    if (Array.isArray(data)) {
      return data.map((item) => this.translateData(item, lang));
    }

    // Handle Objects (e.g., single records or nested relations)
    const translatedData = { ...data };

    // If the object has a 'translations' property
    if (translatedData.translations) {
      // Check if the requested language exists in the translations object
      const langData = translatedData.translations[lang];

      if (langData && typeof langData === 'object') {
        // Override the base properties with the translated properties
        Object.keys(langData).forEach((key) => {
          // Only override if the original object has that property, or you can allow new ones too
          translatedData[key] = langData[key];
        });
      }

      // Optional: Delete the translations payload so it's not exposed to the frontend
      delete translatedData.translations;
    }

    // Ensure areasCovered items are translated when Tamil is requested
    if (lang === 'ta' && Array.isArray(translatedData.areasCovered)) {
      translatedData.areasCovered = translatedData.areasCovered.map((area: any) => {
        return typeof area === 'string' ? translateAreaToTamil(area) : area;
      });
    }

    // Recursively process nested objects (like relations: district.unions)
    for (const key in translatedData) {
      if (
        typeof translatedData[key] === 'object' &&
        translatedData[key] !== null
      ) {
        translatedData[key] = this.translateData(translatedData[key], lang);
      }
    }

    return translatedData;
  }
}

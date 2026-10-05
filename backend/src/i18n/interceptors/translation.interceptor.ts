import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TranslationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    // Use the Accept-Language header, or a custom x-lang header. Default to 'en'.
    // Example: Accept-Language: ta-IN,ta;q=0.9,en-US;q=0.8
    let lang = 'en';
    const acceptLang = request.headers['accept-language'];
    if (acceptLang) {
      // Very basic parser: takes the first two characters of the first language code
      lang = acceptLang.split(',')[0].split('-')[0].toLowerCase();
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

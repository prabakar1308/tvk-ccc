import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class LocalizationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Extract language preference, default to 'en'
    const acceptLanguage = request.headers['accept-language'];
    const locale = acceptLanguage ? acceptLanguage.split(',')[0].split('-')[0].toLowerCase() : 'en';

    return next.handle().pipe(
      map((data) => {
        // If English is requested, just return the data (or strip translations if needed)
        if (locale === 'en' || !data) {
          return data;
        }
        
        return this.localizeData(data, locale);
      }),
    );
  }

  /**
   * Recursively localizes data based on the 'translations' JSON object
   */
  private localizeData(data: any, locale: string): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.localizeData(item, locale));
    }
    
    if (data !== null && typeof data === 'object') {
      const localizedItem = { ...data };
      
      // If translations exist for this locale, apply them
      if (data.translations && data.translations[locale]) {
        const localeData = data.translations[locale];
        for (const key in localeData) {
          if (localeData.hasOwnProperty(key) && localizedItem.hasOwnProperty(key)) {
            localizedItem[key] = localeData[key];
          }
        }
      }
      
      // Recursively process nested objects
      for (const key in localizedItem) {
        if (key !== 'translations' && typeof localizedItem[key] === 'object') {
          localizedItem[key] = this.localizeData(localizedItem[key], locale);
        }
      }
      
      // Optionally remove the translations object so frontend doesn't need to see it
      // delete localizedItem.translations;
      
      return localizedItem;
    }
    
    return data;
  }
}

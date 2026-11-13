import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { translateAreaToTamil } from '../area-translations';
import { translatePersonNameToTamil, translateRoleToTamil } from '../name-translations';
import { translateOrgUnitNameToTamil } from '../org-unit-translations';

@Injectable()
export class TranslationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    // Prioritize explicit lang overrides: x-lang, query param lang, then Accept-Language. Default to 'en'.
    let lang = 'en';
    const reqLang =
      request.headers['x-lang'] ||
      request.query?.lang ||
      request.headers['accept-language'];
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

    // Keep original English areasCovered and name before translations payload might overwrite it
    const originalAreasCovered = Array.isArray(data.areasCovered) ? [...data.areasCovered] : null;
    const originalName = typeof data.name === 'string' ? data.name : undefined;

    // Handle Objects (e.g., single records or nested relations)
    const translatedData = { ...data };

    if (originalName) {
      translatedData.nameEn = originalName;
      translatedData.englishName = originalName;
      const cleanSlug = originalName
        .toLowerCase()
        .replace(/[\s\-_.]+/g, '-')
        .replace(/[^a-z0-9\-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      if (cleanSlug) {
        translatedData.slug = cleanSlug;
      }
    }

    // If the object has a 'translations' property
    if (translatedData.translations) {
      // Check if the requested language exists in the translations object
      const langData = translatedData.translations[lang];

      if (langData && typeof langData === 'object') {
        // Override the base properties with the translated properties
        Object.keys(langData).forEach((key) => {
          if (key === 'name') {
            translatedData.tamilName = langData[key];
            translatedData.nameTa = langData[key];
          }
          // Only override if the original object has that property, or you can allow new ones too
          translatedData[key] = langData[key];
        });
      }

      // Optional: Delete the translations payload so it's not exposed to the frontend
      delete translatedData.translations;
    }

    // Ensure localized items are translated properly when Tamil is requested
    if (lang === 'ta') {
      const sourceAreas = originalAreasCovered || translatedData.areasCovered;
      if (Array.isArray(sourceAreas)) {
        translatedData.areasCovered = sourceAreas.map((area: any) => {
          return typeof area === 'string' ? translateAreaToTamil(area) : area;
        });
      }

      // Translate union name if this is a Union object
      if (
        typeof translatedData.name === 'string' &&
        (translatedData.unitType !== undefined ||
          translatedData.areasCovered !== undefined ||
          translatedData.group !== undefined)
      ) {
        const taUnion = translateOrgUnitNameToTamil(originalName || translatedData.name);
        translatedData.tamilName = taUnion;
        translatedData.nameTa = taUnion;
        translatedData.name = taUnion;
      }

      // Translate union contactName
      if (typeof translatedData.contactName === 'string') {
        translatedData.contactName = translatePersonNameToTamil(translatedData.contactName);
      }

      // Translate union secretary name & role
      if (translatedData.secretary && typeof translatedData.secretary === 'object') {
        if (typeof translatedData.secretary.name === 'string') {
          translatedData.secretary.name = translatePersonNameToTamil(translatedData.secretary.name);
        }
        if (typeof translatedData.secretary.role === 'string') {
          translatedData.secretary.role = translateRoleToTamil(translatedData.secretary.role);
        }
      }

      // Translate Kilai name if this is a Kilai object
      if (
        typeof translatedData.name === 'string' &&
        (translatedData.panchayat !== undefined || translatedData.unionId !== undefined)
      ) {
        const taKilai = translatedData.tamilName || translateAreaToTamil(originalName || translatedData.name);
        translatedData.tamilName = taKilai;
        translatedData.nameTa = taKilai;
        translatedData.name = taKilai;
      }

      // Translate Panchayat name if this is a Panchayat object
      if (
        typeof translatedData.name === 'string' &&
        translatedData.type !== undefined &&
        translatedData.unionId !== undefined
      ) {
        const taPanchayat = translatedData.nameTa || translatedData.tamilName || translateAreaToTamil(originalName || translatedData.name);
        translatedData.tamilName = taPanchayat;
        translatedData.nameTa = taPanchayat;
        translatedData.name = taPanchayat;
      }

      // Translate Village name if this is a Village object
      if (
        typeof translatedData.name === 'string' &&
        translatedData.panchayatId !== undefined
      ) {
        const taVillage = translatedData.nameTa || translatedData.tamilName || translateAreaToTamil(originalName || translatedData.name);
        translatedData.tamilName = taVillage;
        translatedData.nameTa = taVillage;
        translatedData.name = taVillage;
      }

      // Translate Kilai secretaryName
      if (typeof translatedData.secretaryName === 'string') {
        translatedData.secretaryName = translatePersonNameToTamil(translatedData.secretaryName);
      }

      // Translate Kilai panchayat
      if (typeof translatedData.panchayat === 'string') {
        translatedData.panchayat = translateAreaToTamil(translatedData.panchayat);
      }

      // Translate Kilai villages
      if (Array.isArray(translatedData.villages)) {
        translatedData.villages = translatedData.villages.map((v: any) =>
          typeof v === 'string' ? translateAreaToTamil(v) : v,
        );
      }

      // Translate Kilai union relation name if present
      if (translatedData.union && typeof translatedData.union === 'object' && typeof translatedData.union.name === 'string') {
        translatedData.union.name = translateOrgUnitNameToTamil(translatedData.union.name);
      }

      // Translate cadre name & role if this is a Cadre object
      if (typeof translatedData.name === 'string' && (translatedData.memberId || translatedData.level)) {
        translatedData.name = translatePersonNameToTamil(translatedData.name);
        if (typeof translatedData.role === 'string') {
          translatedData.rawRole = translatedData.role;
          translatedData.canonicalRole = translatedData.role;
          translatedData.role = translateRoleToTamil(translatedData.role);
        }
      }
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

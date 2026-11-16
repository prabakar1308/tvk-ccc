import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { I18nService } from './i18n.service';
import { TranslateDto } from './dto/translate.dto';

@ApiTags('i18n')
@Controller('i18n')
export class I18nController {
  constructor(private readonly i18nService: I18nService) {}

  @Post('translate')
  @ApiOperation({
    summary: 'Translate or phonetically transliterate text between English and Tamil',
  })
  @ApiResponse({ status: 200, description: 'Translation successful' })
  async translate(@Body() dto: TranslateDto) {
    if (!dto.text || !dto.text.trim()) {
      return {
        originalText: '',
        targetLanguage: dto.target,
        translatedText: '',
      };
    }
    const translatedText = await this.i18nService.translate(
      dto.text,
      dto.target,
      dto.source,
    );
    return {
      originalText: dto.text,
      targetLanguage: dto.target,
      translatedText,
    };
  }

  @Get('translate')
  @ApiOperation({ summary: 'Translate text via GET query parameters' })
  async translateGet(
    @Query('text') text: string,
    @Query('target') target: string,
    @Query('source') source?: string,
  ) {
    if (!text || !target) {
      throw new BadRequestException('text and target are required query parameters');
    }
    const translatedText = await this.i18nService.translate(text, target, source);
    return {
      originalText: text,
      targetLanguage: target,
      translatedText,
    };
  }

  @Post('transliterate')
  @ApiOperation({
    summary: 'Phonetically transliterate Tamil Nadu place names or person names between English and Tamil',
  })
  @ApiResponse({ status: 200, description: 'Transliteration successful' })
  async transliterate(@Body() dto: TranslateDto) {
    if (!dto.text || !dto.text.trim()) {
      return {
        originalText: '',
        targetLanguage: dto.target,
        translatedText: '',
      };
    }
    const translatedText = await this.i18nService.transliterate(
      dto.text,
      dto.target,
      dto.source,
    );
    return {
      originalText: dto.text,
      targetLanguage: dto.target,
      translatedText,
    };
  }

  @Get('transliterate')
  @ApiOperation({ summary: 'Transliterate text via GET query parameters' })
  async transliterateGet(
    @Query('text') text: string,
    @Query('target') target: string,
    @Query('source') source?: string,
  ) {
    if (!text || !target) {
      throw new BadRequestException('text and target are required query parameters');
    }
    const translatedText = await this.i18nService.transliterate(text, target, source);
    return {
      originalText: text,
      targetLanguage: target,
      translatedText,
    };
  }
}

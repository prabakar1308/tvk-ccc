import { NestFactory } from '@nestjs/core';
process.loadEnvFile();
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set Global Prefix
  app.setGlobalPrefix('api/v1');

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('TVK Command Center (TCC) API')
    .setDescription('The API documentation for TCC backend.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Enable CORS
  app.enableCors();

  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
// Trigger restart for prisma client

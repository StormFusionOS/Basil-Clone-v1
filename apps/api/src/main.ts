import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { MetricsInterceptor } from './monitoring/metrics.interceptor';
import { MetricsService } from './monitoring/metrics.service';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidUnknownValues: false })
  );
  app.useGlobalFilters(new AllExceptionsFilter(new Logger('Exceptions')));
  const metricsService = app.get(MetricsService);
  app.useGlobalInterceptors(
    new RequestLoggingInterceptor(),
    new MetricsInterceptor(metricsService)
  );
  const config = new DocumentBuilder()
    .setTitle('BookForge POS API')
    .setDescription('API documentation for the BookForge POS platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, { useGlobalPrefix: true });
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 8080);
}

void bootstrap();

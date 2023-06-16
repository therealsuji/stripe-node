import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SharedModule } from './modules/shared/shared.module';
import { AppConfigService } from './modules/shared/services/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.select(SharedModule).get(AppConfigService);
  const port = configService.appConfig.port;
  await app.listen(port);
}
bootstrap();

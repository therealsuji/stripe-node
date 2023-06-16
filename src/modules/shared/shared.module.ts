import { Global, Module } from '@nestjs/common';

import { AppConfigService } from './services/config.service';

@Global()
@Module({
  providers: [AppConfigService],
  imports: [],
  exports: [AppConfigService],
})
export class SharedModule {}

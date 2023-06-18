import { Global, Module } from '@nestjs/common';

import { AppConfigService } from './services/config.service';
import { StripeService } from './services/stripe.service';

@Global()
@Module({
  providers: [AppConfigService, StripeService],
  imports: [],
  exports: [AppConfigService, StripeService],
})
export class SharedModule {}

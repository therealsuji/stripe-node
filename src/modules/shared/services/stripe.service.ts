import { Injectable } from '@nestjs/common';
import { Stripe } from 'stripe';
import { AppConfigService } from './config.service';

@Injectable()
export class StripeService {
  stripe: Stripe;

  constructor(private configService: AppConfigService) {}

  onModuleInit() {
    this.stripe = new Stripe(this.configService.appConfig.stripeKey, {
      apiVersion: '2022-11-15',
    });
  }
}

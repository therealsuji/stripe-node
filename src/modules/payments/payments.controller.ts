import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { StripeService } from '../shared/services/stripe.service';
import { StartPaymentDto } from './dtos/save-payment.dto';
import { PaymentDto } from './dtos/payment.dto';
import { AppConfigService } from '../shared/services/config.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CustomerNotFound } from './exceptions/customer-not-found.exception';
import { CreateCustomerDto } from './dtos/create-customer.dto';
import { AuthUser, User } from 'src/decorators/auth-user.decorator';
import { FirebaseService } from '../shared/firebase/firebase.service';
import { Auth } from 'src/decorators/http.decorators';
import { OrderNotFound } from './exceptions/order-not-found.exception';
import { Request } from 'express';

@Controller('payments')
@ApiTags('payments')
export class PaymentsController {
  private logger = new Logger(PaymentsController.name);

  constructor(
    private stripeService: StripeService,
    private configService: AppConfigService,
    private firebaseService: FirebaseService,
  ) {}

  @Auth()
  @Post('create-customer')
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    description: 'payment intent started',
  })
  @ApiResponse({})
  async createCustomer(
    @AuthUser() user: User,
    @Body() createCustomerDto: CreateCustomerDto,
  ) {
    if (user.stripeCustomerAccountId !== null) {
      this.logger.debug('User already has a stripe customer id');
      return;
    }

    const customer = await this.stripeService.stripe.customers.create({
      name: createCustomerDto.name,
      phone: createCustomerDto.phone,
      email: createCustomerDto.email,
      address: {
        line1: createCustomerDto.addressLine1,
        line2: createCustomerDto.addressLine2,
        city: createCustomerDto.city,
        state: createCustomerDto.state,
        country: createCustomerDto.country,
      },
    });

    await this.firebaseService
      .getDb()
      .collection('users')
      .doc(user.uid)
      .set({ stripeCustomerAccountId: customer.id }, { merge: true });
  }

  @Auth()
  @Post('create-store')
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    description: 'Account onboarding started',
  })
  @ApiResponse({})
  async createStore(@AuthUser() user: User, @Req() req: Request) {
    const account = await this.stripeService.stripe.accounts.create({
      type: 'standard',
    });

    await this.firebaseService
      .getDb()
      .collection('users')
      .doc(user.uid)
      .set({ stripeStoreAccountId: account.id }, { merge: true });
    const appUrl = `${req.protocol}://${req.get('Host')}${req.originalUrl}`;
    const accountLink = await this.stripeService.stripe.accountLinks.create({
      account: account.id,
      refresh_url: appUrl,
      //TODO: get DEEP_LINK URL
      return_url: 'https://example.com/return',
      type: 'account_onboarding',
    });
    return accountLink.url;
  }

  @Auth()
  @Post('create-delivery')
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    description: 'Account onboarding started',
  })
  @ApiResponse({})
  async createDelivery(@AuthUser() user: User, @Req() req: Request) {
    const account = await this.stripeService.stripe.accounts.create({
      type: 'standard',
    });

    await this.firebaseService
      .getDb()
      .collection('users')
      .doc(user.uid)
      .set({ stripeDeliveryAccountId: account.id }, { merge: true });
    const appUrl = `${req.protocol}://${req.get('Host')}${req.originalUrl}`;
    const accountLink = await this.stripeService.stripe.accountLinks.create({
      account: account.id,
      refresh_url: appUrl,
      //TODO: get DEEP_LINK URL
      return_url: 'https://example.com/return',
      type: 'account_onboarding',
    });
    return accountLink.url;
  }

  @Auth()
  @Post('complete-order/:order-id')
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    description: 'Order completed and payouts done for store and delivery',
  })
  @ApiResponse({})
  async completeOrder(
    @Param('order-id') orderId: string,
    @AuthUser() user: User,
  ) {
    // TODO: do batch gets
    const order = await this.firebaseService
      .getDb()
      .collection('orders')
      .doc(orderId)
      .get();

    const delivery = await this.firebaseService
      .getDb()
      .doc(order.get('deliveryPersonId'))
      .get();

    if (delivery.id !== user.uid) {
      throw new OrderNotFound();
    }

    const store = await this.firebaseService
      .getDb()
      .doc(order.get('storeId'))
      .get();

    // Give driver 10% of order total
    const driverAmount = order.get('total') * 100 * 0.1;
    const storeAmount = order.get('total') * 100 - driverAmount;
    const deliveryAccountId = delivery.get('stripeDeliveryAccountId');
    const storeAccountId = store.get('stripeStoreAccountId');

    const storePayment = await this.stripeService.stripe.transfers.create({
      amount: storeAmount,
      currency: 'usd',
      destination: storeAccountId,
      description: `Order payment for ${orderId}`,
    });
    this.logger.debug(`store payment done for ${storePayment.id}`);

    const deliveryPayment = await this.stripeService.stripe.transfers.create({
      amount: driverAmount,
      currency: 'usd',
      destination: deliveryAccountId,
      description: `Delivery payment for ${orderId}`,
    });
    this.logger.debug(`deliveryPayment payment done for ${deliveryPayment.id}`);

    await this.firebaseService
      .getDb()
      .collection('orders')
      .doc(orderId)
      .set({ status: 'COMPLETED' }, { merge: true });
  }

  @Auth()
  @Post('refund/:payment-intent-id')
  @HttpCode(HttpStatus.CREATED)
  async refund(@Param('payment-intent-id') id: string, @AuthUser() user: User) {
    if (user.stripeCustomerAccountId === null) {
      throw new CustomerNotFound();
    }
    const paymentIntent =
      await this.stripeService.stripe.paymentIntents.retrieve(id);

    if (!paymentIntent) {
      throw new OrderNotFound();
    }

    await this.stripeService.stripe.refunds.create({
      payment_intent: paymentIntent.id,
    });
  }

  @Auth()
  @Post('withdraw')
  @HttpCode(HttpStatus.CREATED)
  async withdraw(@AuthUser() user: User) {
    if (user.stripeCustomerAccountId !== null) {
      throw new CustomerNotFound();
    }
    const userAccountId =
      user.type == 'delivery'
        ? user.stripeDeliveryAccountId
        : user.stripeStoreAccountId;

    const balance = await this.stripeService.stripe.balance.retrieve({
      stripeAccount: userAccountId,
    });

    const availableBalance = balance.available.find(
      (b) => b.currency === 'usd',
    );

    const payout = await this.stripeService.stripe.payouts.create(
      {
        amount: availableBalance.amount,
        currency: 'usd',
      },
      {
        stripeAccount: userAccountId,
      },
    );

    this.logger.debug(`withdrawl done for ${payout.id}`);
  }

  @Auth()
  @Post('start-payment')
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    description: 'payment intent started',
    type: PaymentDto,
  })
  async saveCard(
    @AuthUser() user: User,
    @Body() savePaymentDto: StartPaymentDto,
  ) {
    if (user.stripeCustomerAccountId === null) {
      throw new CustomerNotFound();
    }

    const customer = await this.stripeService.stripe.customers.retrieve(
      user.stripeCustomerAccountId,
    );

    if (!customer) {
      throw new CustomerNotFound();
    }

    const ephemeralKey = await this.stripeService.stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2022-11-15' },
    );

    const paymentIntent = await this.stripeService.stripe.paymentIntents.create(
      {
        // usd uses smallest unit, cents. for other currencies, check out below
        // https://stripe.com/docs/currencies#zero-decimal
        amount: savePaymentDto.amount * 100,
        currency: 'usd',
        customer: customer.id,
        automatic_payment_methods: {
          enabled: true,
        },
      },
    );
    paymentIntent.id;

    return new PaymentDto(
      paymentIntent.client_secret,
      ephemeralKey.secret,
      customer.id,
      this.configService.appConfig.stripePublishableKey,
    );
  }
}

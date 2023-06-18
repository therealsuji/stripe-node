import { ApiProperty } from '@nestjs/swagger';

export class PaymentDto {
  @ApiProperty()
  paymentIntent: string;

  @ApiProperty()
  ephemeralKey: string;

  @ApiProperty()
  customer: string;

  @ApiProperty()
  publishableKey: string;

  constructor(
    paymentIntent: string,
    ephemeralKey: string,
    customer: string,
    publishableKey: string,
  ) {
    this.paymentIntent = paymentIntent;
    this.ephemeralKey = ephemeralKey;
    this.customer = customer;
    this.publishableKey = publishableKey;
  }
}

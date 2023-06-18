import { NumberField } from '../../../decorators/field.decorators';

export class StartPaymentDto {
  @NumberField({ min: 0, isPositive: true })
  amount: number;
}

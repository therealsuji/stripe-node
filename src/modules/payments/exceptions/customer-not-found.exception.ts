import { NotFoundException } from '@nestjs/common';

export class CustomerNotFound extends NotFoundException {
  constructor(error?: string) {
    super('error.customerNotFound', error);
  }
}

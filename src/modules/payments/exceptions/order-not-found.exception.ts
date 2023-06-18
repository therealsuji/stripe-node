import { NotFoundException } from '@nestjs/common';

export class OrderNotFound extends NotFoundException {
  constructor(error?: string) {
    super('error.OrderNotFound', error);
  }
}

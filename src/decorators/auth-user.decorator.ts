import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';

export interface User {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  stripeCustomerAccountId?: string;
  stripeStoreAccountId?: string;
  stripeDeliveryAccountId?: string;
  type: 'customer' | 'store' | 'delivery';
}

export function AuthUser() {
  return createParamDecorator((_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    const user = request.user;

    return user;
  })();
}

import type { IAuthGuard, Type } from '@nestjs/passport';
import { AuthGuard as NestAuthGuard } from '@nestjs/passport';

export function AuthGuard(): Type<IAuthGuard> {
  const strategies = ['firebase-auth'];

  return NestAuthGuard(strategies);
}

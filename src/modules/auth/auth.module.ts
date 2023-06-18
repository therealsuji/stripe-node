import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { FirebaseAuthStrategy } from './firebase-auth.strategy';
import { FirebaseModule } from '../shared/firebase/firebase.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'firebase-auth' }),
    FirebaseModule,
  ],
  providers: [FirebaseAuthStrategy],
  exports: [],
})
export class AuthModule {}

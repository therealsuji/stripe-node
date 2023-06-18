import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-firebase-jwt';
import { FirebaseService } from '../shared/firebase/firebase.service';

@Injectable()
export class FirebaseAuthStrategy extends PassportStrategy(
  Strategy,
  'firebase-auth',
) {
  constructor(private firebaseService: FirebaseService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(token: string) {
    const firebaseUser = await this.firebaseService.verifyIdToken(token);

    if (firebaseUser === null) {
      throw new UnauthorizedException();
    }

    const user = await this.firebaseService.getUser(firebaseUser.uid);
    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}

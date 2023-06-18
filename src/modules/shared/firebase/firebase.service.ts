import { Injectable, Logger } from '@nestjs/common';
import firebaseAdmin from 'firebase-admin';

import { AppConfigService } from '../services/config.service';
import type { User } from 'src/decorators/auth-user.decorator';

@Injectable()
export class FirebaseService {
  private firebaseApp: firebaseAdmin.app.App;

  private readonly logger = new Logger(FirebaseService.name);

  constructor(configService: AppConfigService) {
    this.firebaseApp = firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert({
        clientEmail: configService.firebaseAdminConfig.client_email,
        privateKey: configService.firebaseAdminConfig.private_key,
        projectId: configService.firebaseAdminConfig.project_id,
      }),
    });
  }

  getAuth = (): firebaseAdmin.auth.Auth => this.firebaseApp.auth();
  getDb = (): firebaseAdmin.firestore.Firestore => this.firebaseApp.firestore();

  verifyIdToken = (token: string) =>
    this.getAuth()
      .verifyIdToken(token, true)
      .catch((error) => {
        this.logger.verbose(`Firebase verify: ${error}`);

        return null;
      });

  getUser = async (uid: string): Promise<User> => {
    const user = await this.getAuth().getUser(uid);
    const userData = await this.getDb().collection('users').doc(uid).get();
    return {
      uid: user.uid,
      email: user.email,
      name: user.displayName,
      picture: user.photoURL,
      stripeCustomerAccountId: userData.get('stripeCustomerAccountId'),
      stripeStoreAccountId: userData.get('stripeStoreAccountId'),
      stripeDeliveryAccountId: userData.get('stripeDeliveryAccountId'),
      type: userData.get('userType'),
    };
  };

  getMessaging = (): firebaseAdmin.messaging.Messaging =>
    this.firebaseApp.messaging();
}

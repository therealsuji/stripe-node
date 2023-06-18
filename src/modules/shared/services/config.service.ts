import { Injectable, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  get nodeEnv(): string {
    return this.getString('NODE_ENV');
  }

  private getString(key: string): string {
    const value = this.get(key);

    return value.replace(/\\n/g, '\n');
  }

  get documentationEnabled(): boolean {
    return this.getBoolean('ENABLE_DOCUMENTATION');
  }

  private getBoolean(key: string): boolean {
    const value = this.get(key);

    try {
      return Boolean(JSON.parse(value));
    } catch {
      throw new Error(key + ' env var is not a boolean');
    }
  }

  get firebaseAdminConfig() {
    return {
      type: this.getString('TYPE'),
      project_id: this.getString('PROJECT_ID'),
      private_key_id: this.getString('PRIVATE_KEY_ID'),
      private_key: this.getString('PRIVATE_KEY'),
      client_email: this.getString('CLIENT_EMAIL'),
      client_id: this.getString('CLIENT_ID'),
      auth_uri: this.getString('AUTH_URI'),
      token_uri: this.getString('TOKEN_URI'),
      auth_provider_x509_cert_url: this.getString(
        'AUTH_PROVIDER_X509_CERT_URL',
      ),
      client_x509_cert_url: this.getString('CLIENT_X509_CERT_URL'),
    };
  }

  private get(key: string): string {
    const value = this.configService.get<string>(key);

    if (value == null || value === '' || value === undefined) {
      throw new Error(key + ' environment variable does not set'); // probably we should call process.exit() too to avoid locking the service
    }

    return value;
  }

  get logLevel(): LogLevel[] {
    return this.getString('LOG_LEVEL').split(',') as unknown as LogLevel[];
  }

  get appConfig() {
    return {
      port: this.getString('PORT'),
      stripeKey: this.getString('STRIPE_SECRET_KEY'),
      stripePublishableKey: this.getString('STRIPE_PUBLISHABLE_KEY'),
    };
  }
}

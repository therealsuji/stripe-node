import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { SharedModule } from '../shared/shared.module';
import { FirebaseModule } from '../shared/firebase/firebase.module';

@Module({
  imports: [SharedModule, FirebaseModule],
  providers: [PaymentsService],
  controllers: [PaymentsController],
})
export class PaymentsModule {}

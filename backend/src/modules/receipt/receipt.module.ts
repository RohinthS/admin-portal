import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReceiptService } from './receipt.service';
import { ReceiptController } from './receipt.controller';
import { Receipt, ReceiptSchema } from '../../schemas/receipt.schema';
import { Enrollment, EnrollmentSchema } from '../../schemas/enrollment.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Receipt.name, schema: ReceiptSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
    ]),
    AuthModule,
  ],
  controllers: [ReceiptController],
  providers: [ReceiptService],
  exports: [ReceiptService, MongooseModule],
})
export class ReceiptModule {}

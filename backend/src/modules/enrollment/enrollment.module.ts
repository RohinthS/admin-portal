import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EnrollmentService } from './enrollment.service';
import { EnrollmentController } from './enrollment.controller';
import { Enrollment, EnrollmentSchema } from '../../schemas/enrollment.schema';
import { Receipt, ReceiptSchema } from '../../schemas/receipt.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Receipt.name, schema: ReceiptSchema },
    ]),
    AuthModule,
  ],
  controllers: [EnrollmentController],
  providers: [EnrollmentService],
  exports: [EnrollmentService, MongooseModule],
})
export class EnrollmentModule {}

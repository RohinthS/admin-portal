import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { Attendance, AttendanceSchema } from '../../schemas/attendance.schema';
import { CreditTransaction, CreditTransactionSchema } from '../../schemas/credit-transaction.schema';
import { CreditRule, CreditRuleSchema } from '../../schemas/credit-rule.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Attendance.name, schema: AttendanceSchema },
      { name: CreditTransaction.name, schema: CreditTransactionSchema },
      { name: CreditRule.name, schema: CreditRuleSchema },
    ]),
    AuthModule,
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService, MongooseModule],
})
export class AttendanceModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { Payroll, PayrollSchema } from '../../schemas/payroll.schema';
import { Staff, StaffSchema } from '../../schemas/staff.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payroll.name, schema: PayrollSchema },
      { name: Staff.name, schema: StaffSchema },
    ]),
    AuthModule,
  ],
  controllers: [PayrollController],
  providers: [PayrollService],
  exports: [PayrollService, MongooseModule],
})
export class PayrollModule {}

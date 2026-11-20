import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';
import { CreditRule, CreditRuleSchema } from '../../schemas/credit-rule.schema';
import { CreditTransaction, CreditTransactionSchema } from '../../schemas/credit-transaction.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { Enrollment, EnrollmentSchema } from '../../schemas/enrollment.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CreditRule.name, schema: CreditRuleSchema },
      { name: CreditTransaction.name, schema: CreditTransactionSchema },
      { name: User.name, schema: UserSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
    ]),
    AuthModule,
  ],
  controllers: [CreditsController],
  providers: [CreditsService],
  exports: [CreditsService],
})
export class CreditsModule {}


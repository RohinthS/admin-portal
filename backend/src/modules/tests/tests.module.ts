import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TestsService } from './tests.service';
import { TestsController } from './tests.controller';
import {
  Question,
  QuestionSchema,
  QuestionSet,
  QuestionSetSchema,
  TestAttempt,
  TestAttemptSchema,
} from '../../schemas/test.schema';
import { CreditTransaction, CreditTransactionSchema } from '../../schemas/credit-transaction.schema';
import { Course, CourseSchema } from '../../schemas/course.schema';
import { Enrollment, EnrollmentSchema } from '../../schemas/enrollment.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
      { name: QuestionSet.name, schema: QuestionSetSchema },
      { name: TestAttempt.name, schema: TestAttemptSchema },
      { name: CreditTransaction.name, schema: CreditTransactionSchema },
      { name: Course.name, schema: CourseSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
    ]),
    AuthModule,
  ],
  controllers: [TestsController],
  providers: [TestsService],
  exports: [TestsService, MongooseModule],
})
export class TestsModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Enrollment, EnrollmentSchema } from '../../schemas/enrollment.schema';
import { Receipt, ReceiptSchema } from '../../schemas/receipt.schema';
import { Enquiry, EnquirySchema } from '../../schemas/enquiry.schema';
import { ExpenseEntry, ExpenseEntrySchema } from '../../schemas/expense.schema';
import { Attendance, AttendanceSchema } from '../../schemas/attendance.schema';
import { Task, TaskSchema } from '../../schemas/task.schema';
import { DailyReport, DailyReportSchema } from '../../schemas/daily-report.schema';
import { Installment, InstallmentSchema } from '../../schemas/installment.schema';
import { LeaveRequest, LeaveRequestSchema } from '../../schemas/leave.schema';
import { Course, CourseSchema } from '../../schemas/course.schema';
import { Staff, StaffSchema } from '../../schemas/staff.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Receipt.name, schema: ReceiptSchema },
      { name: Enquiry.name, schema: EnquirySchema },
      { name: ExpenseEntry.name, schema: ExpenseEntrySchema },
      { name: Attendance.name, schema: AttendanceSchema },
      { name: Task.name, schema: TaskSchema },
      { name: DailyReport.name, schema: DailyReportSchema },
      { name: Installment.name, schema: InstallmentSchema },
      { name: LeaveRequest.name, schema: LeaveRequestSchema },
      { name: Course.name, schema: CourseSchema },
      { name: Staff.name, schema: StaffSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}

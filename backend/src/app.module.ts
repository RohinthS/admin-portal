import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { RolesModule } from './modules/roles/roles.module';
import { CoursesModule } from './modules/courses/courses.module';
import { EnquiryModule } from './modules/enquiry/enquiry.module';
import { EnrollmentModule } from './modules/enrollment/enrollment.module';
import { ReceiptModule } from './modules/receipt/receipt.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { LeavesModule } from './modules/leaves/leaves.module';
import { DailyReportsModule } from './modules/daily-reports/daily-reports.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { TestsModule } from './modules/tests/tests.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { StaffModule } from './modules/staff/staff.module';
import { ReportsModule } from './modules/reports/reports.module';
import { CreditsModule } from './modules/credits/credits.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'backend/.env'],
    }),
    DatabaseModule,
    AuthModule,
    CompanyModule,
    RolesModule,
    CoursesModule,
    EnquiryModule,
    EnrollmentModule,
    ReceiptModule,
    AttendanceModule,
    LeavesModule,
    DailyReportsModule,
    TasksModule,
    TestsModule,
    ExpensesModule,
    PayrollModule,
    StaffModule,
    ReportsModule,
    CreditsModule,
  ],
})
export class AppModule {}

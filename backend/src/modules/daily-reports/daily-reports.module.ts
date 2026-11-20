import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DailyReportsService } from './daily-reports.service';
import { DailyReportsController } from './daily-reports.controller';
import { DailyReport, DailyReportSchema } from '../../schemas/daily-report.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: DailyReport.name, schema: DailyReportSchema }]),
    AuthModule,
  ],
  controllers: [DailyReportsController],
  providers: [DailyReportsService],
  exports: [DailyReportsService, MongooseModule],
})
export class DailyReportsModule {}

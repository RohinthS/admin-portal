import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  getDashboardStats(@Query('company_id') companyId?: string) {
    return this.reportsService.getDashboardStats(companyId);
  }

  @Get('student-dashboard')
  getStudentDashboard(@CurrentUser() user: any, @Query('company_id') companyId?: string) {
    return this.reportsService.getStudentDashboardStats(user, companyId);
  }

  @Get('collections')
  getCollections(
    @Query('company_id') companyId?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.reportsService.getCollectionReport(companyId, startDate, endDate);
  }
}

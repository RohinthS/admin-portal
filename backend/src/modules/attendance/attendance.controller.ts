import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  getAttendance(
    @Query('company_id') companyId: string,
    @Query('date') date: string,
    @Query('user_type') userType: 'staff' | 'student',
  ) {
    return this.attendanceService.getAttendance(companyId, date, userType);
  }

  @Post()
  markAttendanceDirect(@Body() data: any) {
    return this.attendanceService.markAttendance(data);
  }

  @Post('mark')
  markAttendance(@Body() data: any) {
    return this.attendanceService.markAttendance(data);
  }

  @Get('monthly-summary')
  getMonthlySummary(
    @Query('company_id') companyId: string,
    @Query('month_year') monthYear: string,
    @Query('user_type') userType: 'staff' | 'student',
  ) {
    return this.attendanceService.getMonthlySummary(companyId, monthYear, userType);
  }
}

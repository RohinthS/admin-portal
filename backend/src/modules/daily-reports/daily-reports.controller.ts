import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DailyReportsService } from './daily-reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('daily-reports')
export class DailyReportsController {
  constructor(private readonly reportsService: DailyReportsService) {}

  @Get()
  findAll(
    @Query('company_id') companyId?: string,
    @Query('user_type') userType?: string,
    @Query('date') date?: string,
  ) {
    return this.reportsService.findAll(companyId, userType, date);
  }

  @Post()
  create(@Body() data: any) {
    return this.reportsService.create(data);
  }

  @Put(':id/verify')
  verify(@Param('id') id: string, @Body('feedback') feedback: string, @CurrentUser() user: any) {
    return this.reportsService.verify(id, user.sub, feedback);
  }
}

import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('leaves')
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Get()
  findAll(@Query('company_id') companyId?: string, @Query('status') status?: string) {
    return this.leavesService.findAll(companyId, status);
  }

  @Get('staff/:staffId')
  findByStaff(@Param('staffId') staffId: string) {
    return this.leavesService.findByStaff(staffId);
  }

  @Post('apply')
  applyLeave(@Body() data: any) {
    return this.leavesService.applyLeave(data);
  }

  @Put(':id/review')
  reviewLeave(
    @Param('id') id: string,
    @Body() body: { status: 'approved' | 'rejected'; remarks?: string },
    @CurrentUser() user: any,
  ) {
    return this.leavesService.reviewLeave(id, user.sub, body.status, body.remarks);
  }
}

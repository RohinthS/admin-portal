import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get()
  findAll(
    @Query('company_id') companyId?: string,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return this.payrollService.findAll(companyId, month, year);
  }

  @Post('generate')
  generate(
    @Body('company_id') companyId: string,
    @Body('month') month: number,
    @Body('year') year: number,
  ) {
    return this.payrollService.generateMonthlyPayroll(companyId, month, year);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.payrollService.updatePayroll(id, data);
  }
}

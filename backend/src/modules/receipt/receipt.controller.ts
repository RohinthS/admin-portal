import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ReceiptService } from './receipt.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('receipts')
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}

  @Get()
  findAll(
    @Query('company_id') companyId?: string,
    @Query('enrollment_id') enrollmentId?: string,
  ) {
    return this.receiptService.findAll(companyId, enrollmentId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.receiptService.findById(id);
  }

  @Post()
  create(@Body() data: any, @CurrentUser() user: any) {
    data.created_by = user.sub;
    return this.receiptService.create(data);
  }
}

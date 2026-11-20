import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { EnquiryService } from './enquiry.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('enquiries')
export class EnquiryController {
  constructor(private readonly enquiryService: EnquiryService) {}

  @Get()
  findAll(@Query('company_id') companyId?: string, @Query('status') status?: string) {
    return this.enquiryService.findAll(companyId, status);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.enquiryService.findById(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.enquiryService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.enquiryService.update(id, data);
  }

  @Post(':id/followups')
  addFollowup(@Param('id') id: string, @Body() data: any, @CurrentUser() user: any) {
    data.staff_id = data.staff_id || user.sub;
    return this.enquiryService.addFollowup(id, data);
  }

  @Get(':id/whatsapp')
  getWhatsApp(@Param('id') id: string) {
    return this.enquiryService.getWhatsAppMessageUrl(id);
  }
}

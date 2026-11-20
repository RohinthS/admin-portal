import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('enrollments')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Get()
  findAll(
    @Query('company_id') companyId?: string,
    @Query('course_type') courseType?: string,
  ) {
    return this.enrollmentService.findAll(companyId, courseType);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.enrollmentService.findById(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.enrollmentService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.enrollmentService.update(id, data);
  }
}

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get('rules')
  getRules(@Query('company_id') companyId: string) {
    return this.creditsService.getRules(companyId);
  }

  @Put('rules')
  saveRules(
    @Query('company_id') companyId: string,
    @Body('categories') categories: any[],
    @CurrentUser() user: any,
  ) {
    if (user.user_type !== 'admin') {
      throw new ForbiddenException('Only Administrators can configure credit rules');
    }
    return this.creditsService.saveRules(companyId, categories);
  }

  @Post('rules/reset')
  resetRules(@Query('company_id') companyId: string, @CurrentUser() user: any) {
    if (user.user_type !== 'admin') {
      throw new ForbiddenException('Only Administrators can reset credit rules');
    }
    return this.creditsService.resetRules(companyId);
  }

  @Post('award')
  awardCredits(
    @Query('company_id') companyId: string,
    @Body() data: any,
    @CurrentUser() user: any,
  ) {
    if (user.user_type === 'student') {
      // Allow students to trigger automated video watch milestone credits for their own account
      const isSelfVideoAward =
        data.category === 'video' &&
        (data.student_id === user.sub?.toString() || data.student_id === user._id?.toString());
      if (!isSelfVideoAward) {
        throw new ForbiddenException('Students are not allowed to award manual credits');
      }
    }
    const targetCompanyId = companyId || user.company_id;
    return this.creditsService.awardCredits(targetCompanyId, data, user);
  }

  @Get('student/:studentId')
  getStudentCredits(@Param('studentId') studentId: string, @CurrentUser() user: any) {
    // If student, ensure they can only view their own credits
    const isSelf =
      user.sub?.toString() === studentId?.toString() ||
      user._id?.toString() === studentId?.toString() ||
      user.id?.toString() === studentId?.toString();
    if (user.user_type === 'student' && !isSelf) {
      throw new ForbiddenException('Access denied: You can only view your own credits');
    }
    return this.creditsService.getStudentCredits(studentId);
  }

  @Get('ledger')
  getLedger(
    @Query('company_id') companyId: string,
    @CurrentUser() user: any,
    @Query('search') search?: string,
  ) {
    if (user.user_type === 'student') {
      throw new ForbiddenException('Access denied to credit ledger');
    }
    const targetCompanyId = companyId || user.company_id;
    return this.creditsService.getLedger(targetCompanyId, search);
  }

  @Delete('transaction/:id')
  deleteTransaction(@Param('id') id: string, @CurrentUser() user: any) {
    if (user.user_type !== 'admin') {
      throw new ForbiddenException('Only Administrators can revoke or delete credit transactions');
    }
    return this.creditsService.deleteTransaction(id);
  }
}


import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  async findAll(@Query('user_type') userType?: string, @Query('company_id') companyId?: string) {
    return this.authService.findUsers(userType, companyId);
  }
}

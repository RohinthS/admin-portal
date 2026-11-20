import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/permissions.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { username: string; password: string; company_id?: string }) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  async register(@Body() registerDto: { username: string; password: string; name: string; email?: string; phone?: string; company_id?: string; role_id?: string }) {
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@CurrentUser() user: any) {
    return this.authService.getMe(user.sub, user.company_id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('switch-company')
  async switchCompany(@CurrentUser() user: any, @Body('company_id') companyId: string) {
    return this.authService.switchCompany(user.sub, companyId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('update-profile')
  async updateProfile(
    @CurrentUser() user: any,
    @Body() data: { name?: string; phone?: string; email?: string; password?: string },
  ) {
    return this.authService.updateProfile(user.sub, data);
  }
}

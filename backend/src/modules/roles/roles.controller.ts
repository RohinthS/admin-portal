import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('modules')
  getModules() {
    return this.rolesService.getModules();
  }

  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.rolesService.findById(id);
  }

  @Post()
  create(@Body() data: { role_name: string; description?: string }) {
    return this.rolesService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: { role_name?: string; description?: string; status?: number }) {
    return this.rolesService.update(id, data);
  }

  @Get(':id/permissions')
  getPermissions(@Param('id') id: string, @Query('company_id') companyId: string) {
    return this.rolesService.getRolePermissions(id, companyId);
  }

  @Post(':id/permissions')
  savePermissions(
    @Param('id') id: string,
    @Body() body: { company_id: string; permissions: Array<{ page: string; actions: string[] }> },
  ) {
    return this.rolesService.saveRolePermissions(id, body.company_id, body.permissions);
  }
}

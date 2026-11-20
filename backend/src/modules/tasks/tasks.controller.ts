import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(
    @Query('company_id') companyId?: string,
    @Query('task_for') taskFor?: string,
    @Query('assigned_to') assignedTo?: string,
  ) {
    return this.tasksService.findAll(companyId, taskFor, assignedTo);
  }

  @Get('my-student-tasks')
  getMyStudentTasks(@CurrentUser() user: any, @Query('company_id') companyId?: string) {
    return this.tasksService.findForStudent(user, companyId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.tasksService.findById(id);
  }

  @Post()
  create(@Body() data: any, @CurrentUser() user: any) {
    data.assigned_by = user.sub;
    return this.tasksService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.tasksService.update(id, data);
  }

  @Post(':id/comments')
  addComment(@Param('id') id: string, @Body('comment') comment: string, @CurrentUser() user: any) {
    return this.tasksService.addComment(id, user.sub, comment);
  }
}

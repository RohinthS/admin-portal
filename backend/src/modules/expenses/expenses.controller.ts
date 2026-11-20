import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get('categories')
  getCategories() {
    return this.expensesService.getCategories();
  }

  @Post('categories')
  createCategory(@Body() data: any) {
    return this.expensesService.createCategory(data);
  }

  @Get()
  findAll(
    @Query('company_id') companyId?: string,
    @Query('month_year') monthYear?: string,
    @Query('from_date') fromDate?: string,
    @Query('to_date') toDate?: string,
    @Query('category_id') categoryId?: string,
  ) {
    return this.expensesService.findAll(companyId, monthYear, fromDate, toDate, categoryId);
  }

  @Post()
  create(@Body() data: any, @CurrentUser() user: any) {
    data.created_by = user.sub;
    return this.expensesService.create(data);
  }
}

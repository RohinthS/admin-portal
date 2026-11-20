import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ExpenseCategory,
  ExpenseCategoryDocument,
  ExpenseEntry,
  ExpenseEntryDocument,
} from '../../schemas/expense.schema';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(ExpenseCategory.name) private readonly categoryModel: Model<ExpenseCategoryDocument>,
    @InjectModel(ExpenseEntry.name) private readonly entryModel: Model<ExpenseEntryDocument>,
  ) {}

  async getCategories() {
    return this.categoryModel.find({ status: 1 }).sort({ category_name: 1 });
  }

  async createCategory(data: Partial<ExpenseCategory>) {
    const cat = new this.categoryModel(data);
    return cat.save();
  }

  async findAll(
    companyId?: string,
    monthYear?: string,
    fromDate?: string,
    toDate?: string,
    categoryId?: string,
  ) {
    const query: any = {};
    if (companyId) query.company_id = new Types.ObjectId(companyId);
    if (categoryId) query.category_id = new Types.ObjectId(categoryId);
    if (monthYear) query.expense_date = { $regex: `^${monthYear}` };
    if (fromDate || toDate) {
      query.expense_date = query.expense_date || {};
      if (fromDate) query.expense_date.$gte = fromDate;
      if (toDate) query.expense_date.$lte = toDate;
    }

    return this.entryModel
      .find(query)
      .populate('category_id', 'category_name')
      .populate('company_id', 'company_name branch')
      .sort({ expense_date: -1 });
  }

  async create(data: Partial<ExpenseEntry>) {
    const entry = new this.entryModel(data);
    return entry.save();
  }
}

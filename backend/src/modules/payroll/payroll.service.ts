import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payroll, PayrollDocument } from '../../schemas/payroll.schema';
import { Staff, StaffDocument } from '../../schemas/staff.schema';

@Injectable()
export class PayrollService {
  constructor(
    @InjectModel(Payroll.name) private readonly payrollModel: Model<PayrollDocument>,
    @InjectModel(Staff.name) private readonly staffModel: Model<StaffDocument>,
  ) {}

  async findAll(companyId?: string, month?: number, year?: number) {
    const query: any = {};
    if (companyId) query.company_id = new Types.ObjectId(companyId);
    if (month) query.month = Number(month);
    if (year) query.year = Number(year);

    return this.payrollModel
      .find(query)
      .populate({
        path: 'staff_id',
        select: 'staff_name emp_code designation department email phone salary role_id role_name doj status',
        populate: { path: 'role_id', select: 'role_name' },
      })
      .sort({ createdAt: -1 });
  }

  async generateMonthlyPayroll(companyId: string, month: number, year: number) {
    const staffList = await this.staffModel.find({
      company_id: new Types.ObjectId(companyId),
      status: 1,
    });

    const operations = staffList.map((st) => {
      const basic = st.salary || 0;
      return {
        updateOne: {
          filter: {
            company_id: new Types.ObjectId(companyId),
            staff_id: st._id,
            month: Number(month),
            year: Number(year),
          },
          update: {
            $setOnInsert: {
              basic_salary: basic,
              allowances: 0,
              deductions: 0,
              net_salary: basic,
              payment_status: 'unpaid',
            },
          },
          upsert: true,
        },
      };
    });

    if (operations.length > 0) {
      await this.payrollModel.bulkWrite(operations);
    }

    return this.findAll(companyId, month, year);
  }

  async updatePayroll(id: string, data: { allowances?: number; deductions?: number; payment_status?: string; payment_mode?: string }) {
    const payroll = await this.payrollModel.findById(id);
    if (!payroll) throw new NotFoundException('Payroll record not found');

    if (data.allowances !== undefined) payroll.allowances = data.allowances;
    if (data.deductions !== undefined) payroll.deductions = data.deductions;
    if (data.payment_status !== undefined) payroll.payment_status = data.payment_status;
    if (data.payment_mode !== undefined) payroll.payment_mode = data.payment_mode;

    payroll.net_salary = payroll.basic_salary + (payroll.allowances || 0) - (payroll.deductions || 0);
    if (payroll.payment_status === 'paid' && !payroll.payment_date) {
      payroll.payment_date = new Date();
    }

    return payroll.save();
  }
}

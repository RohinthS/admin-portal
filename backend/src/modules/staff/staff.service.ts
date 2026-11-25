import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Staff, StaffDocument } from '../../schemas/staff.schema';
import { Payroll, PayrollDocument } from '../../schemas/payroll.schema';
import { Role, RoleDocument } from '../../schemas/role.schema';

@Injectable()
export class StaffService {
  constructor(
    @InjectModel(Staff.name) private readonly staffModel: Model<StaffDocument>,
    @InjectModel(Payroll.name) private readonly payrollModel: Model<PayrollDocument>,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
  ) {}

  async findAll(companyId?: string) {
    const query: any = {};
    if (companyId) query.company_id = new Types.ObjectId(companyId);

    return this.staffModel
      .find(query)
      .populate('role_id', 'role_name description')
      .populate('company_id', 'company_name branch')
      .sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const staff = await this.staffModel
      .findById(id)
      .populate('role_id', 'role_name description')
      .populate('company_id', 'company_name branch');
    if (!staff) throw new NotFoundException('Staff member not found');
    return staff;
  }

  async create(data: {
    company_id: string;
    staff_name: string;
    emp_code?: string;
    role_id?: string;
    role_name?: string;
    designation?: string;
    department?: string;
    salary?: number;
    email?: string;
    phone?: string;
    doj?: Date;
    dob?: Date;
    address?: string;
  }) {
    let resolvedRoleName = data.role_name;
    let roleIdObj: Types.ObjectId | undefined = undefined;

    if (data.role_id) {
      try {
        roleIdObj = new Types.ObjectId(data.role_id);
        const role = await this.roleModel.findById(roleIdObj);
        if (role) resolvedRoleName = role.role_name;
      } catch (_) {}
    }

    const newStaff = await this.staffModel.create({
      company_id: new Types.ObjectId(data.company_id),
      staff_name: data.staff_name,
      emp_code: data.emp_code || `EMP-${Date.now().toString().slice(-4)}`,
      role_id: roleIdObj,
      role_name: resolvedRoleName || data.designation || 'Staff',
      designation: data.designation || 'Staff Member',
      department: data.department || 'Academics',
      salary: Number(data.salary) || 0,
      email: data.email,
      phone: data.phone,
      doj: data.doj ? new Date(data.doj) : new Date(),
      dob: data.dob ? new Date(data.dob) : undefined,
      address: data.address,
      status: 1,
    });

    // Auto-create/upsert payroll record for current month & year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const basic = Number(data.salary) || 0;

    await this.payrollModel.updateOne(
      {
        company_id: new Types.ObjectId(data.company_id),
        staff_id: newStaff._id,
        month: currentMonth,
        year: currentYear,
      },
      {
        $setOnInsert: {
          basic_salary: basic,
          allowances: 0,
          deductions: 0,
          net_salary: basic,
          payment_status: 'unpaid',
        },
      },
      { upsert: true },
    );

    return newStaff;
  }

  async update(id: string, data: any) {
    if (data.role_id) {
      try {
        const roleIdObj = new Types.ObjectId(data.role_id);
        const role = await this.roleModel.findById(roleIdObj);
        if (role) data.role_name = role.role_name;
        data.role_id = roleIdObj;
      } catch (_) {}
    }

    const updated = await this.staffModel.findByIdAndUpdate(id, { $set: data }, { new: true });
    if (!updated) throw new NotFoundException('Staff member not found');

    // If salary changed, update current and future unclosed payrolls
    if (data.salary !== undefined) {
      const now = new Date();
      await this.payrollModel.updateMany(
        {
          staff_id: new Types.ObjectId(id),
          month: { $gte: now.getMonth() + 1 },
          year: now.getFullYear(),
          payment_status: 'unpaid',
        },
        {
          $set: {
            basic_salary: Number(data.salary),
            net_salary: Number(data.salary),
          },
        },
      );
    }

    return updated;
  }

  async delete(id: string) {
    const deleted = await this.staffModel.findByIdAndUpdate(id, { $set: { status: 0 } }, { new: true });
    if (!deleted) throw new NotFoundException('Staff member not found');
    return { success: true, message: 'Staff member deactivated successfully' };
  }
}

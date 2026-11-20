import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Role, RoleDocument, RolePermission, RolePermissionDocument } from '../../schemas/role.schema';

export const SYSTEM_MODULES = [
  { key: 'dashboard', name: 'Dashboard' },
  { key: 'enrollment_training', name: 'Enrollment Training' },
  { key: 'enrollment_internship', name: 'Enrollment Internship' },
  { key: 'course', name: 'Course' },
  { key: 'course_closure', name: 'Course Closure' },
  { key: 'course_enquiry', name: 'Course Enquiry' },
  { key: 'enquiry_followup', name: 'Enquiry Follow-up' },
  { key: 'receipt', name: 'Receipt & Payments' },
  { key: 'installment', name: 'Installment Follow-up' },
  { key: 'attendance', name: 'Staff Attendance' },
  { key: 'student_attendance', name: 'Student Attendance' },
  { key: 'daily_report', name: 'Daily Report' },
  { key: 'student_report', name: 'Student Report' },
  { key: 'task', name: 'Task' },
  { key: 'student_task', name: 'Student Task' },
  { key: 'leave_approval', name: 'Leave Approval' },
  { key: 'leave_history', name: 'Leave History' },
  { key: 'expense', name: 'Expense Management' },
  { key: 'payroll', name: 'Payroll & Payslips' },
  { key: 'test', name: 'Assessment & Tests' },
  { key: 'feedback', name: 'Feedback & Reviews' },
  { key: 'company', name: 'Company & Branches' },
  { key: 'staff', name: 'Staff Management' },
  { key: 'role', name: 'Roles & Permissions' },
  { key: 'reports', name: 'Reports & Analytics' },
];

export const SYSTEM_ACTIONS = [
  { key: 'V', name: 'View' },
  { key: 'A', name: 'Add' },
  { key: 'E', name: 'Edit' },
  { key: 'D', name: 'Delete' },
];

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(RolePermission.name) private readonly rolePermissionModel: Model<RolePermissionDocument>,
  ) {}

  getModules() {
    return {
      modules: SYSTEM_MODULES,
      actions: SYSTEM_ACTIONS,
    };
  }

  async findAll() {
    return this.roleModel.find({ status: 1 }).sort({ createdAt: -1 });
  }

  async findById(id: string) {
    const role = await this.roleModel.findById(id);
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async create(data: { role_name: string; description?: string }) {
    const role = new this.roleModel(data);
    return role.save();
  }

  async update(id: string, data: { role_name?: string; description?: string; status?: number }) {
    const role = await this.roleModel.findByIdAndUpdate(id, data, { new: true });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async getRolePermissions(roleId: string, companyId: string) {
    const permissions = await this.rolePermissionModel.find({
      role_id: new Types.ObjectId(roleId),
      company_id: new Types.ObjectId(companyId),
    });

    const permMap: Record<string, string[]> = {};
    for (const p of permissions) {
      permMap[p.permission_page] = p.actions && p.actions.length > 0
        ? p.actions
        : p.permission_action ? p.permission_action.split('$$') : [];
    }

    return {
      role_id: roleId,
      company_id: companyId,
      modules: SYSTEM_MODULES.map((m) => ({
        key: m.key,
        name: m.name,
        actions: permMap[m.key] || [],
      })),
    };
  }

  async saveRolePermissions(roleId: string, companyId: string, permissions: Array<{ page: string; actions: string[] }>) {
    // Delete existing permissions for this role and company
    await this.rolePermissionModel.deleteMany({
      role_id: new Types.ObjectId(roleId),
      company_id: new Types.ObjectId(companyId),
    });

    const toInsert = permissions
      .filter((p) => p.actions && p.actions.length > 0)
      .map((p) => {
        // Enforce View permission if Add, Edit, or Delete is selected
        const actionsSet = new Set(p.actions);
        if (actionsSet.has('A') || actionsSet.has('E') || actionsSet.has('D')) {
          actionsSet.add('V');
        }
        const actionArray = Array.from(actionsSet);
        const actionString = actionArray.join('$$');

        return {
          role_id: new Types.ObjectId(roleId),
          company_id: new Types.ObjectId(companyId),
          permission_page: p.page,
          permission_action: actionString,
          actions: actionArray,
        };
      });

    if (toInsert.length > 0) {
      await this.rolePermissionModel.insertMany(toInsert);
    }

    return {
      message: 'Role permissions updated successfully',
      count: toInsert.length,
    };
  }
}

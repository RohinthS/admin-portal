import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LeaveRequest, LeaveRequestDocument } from '../../schemas/leave.schema';

@Injectable()
export class LeavesService {
  constructor(
    @InjectModel(LeaveRequest.name) private readonly leaveModel: Model<LeaveRequestDocument>,
  ) {}

  async findAll(companyId?: string, status?: string) {
    const query: any = {};
    if (companyId) query.company_id = new Types.ObjectId(companyId);
    if (status) query.status = status;

    return this.leaveModel
      .find(query)
      .populate('staff_id', 'staff_name emp_code department')
      .populate('reviewed_by', 'name')
      .sort({ createdAt: -1 });
  }

  async findByStaff(staffId: string) {
    return this.leaveModel.find({ staff_id: new Types.ObjectId(staffId) }).sort({ createdAt: -1 });
  }

  async applyLeave(data: {
    company_id: string;
    staff_id: string;
    leave_type: string;
    from_date: string;
    to_date: string;
    total_days: number;
    reason: string;
  }) {
    const leave = new this.leaveModel({
      company_id: new Types.ObjectId(data.company_id),
      staff_id: new Types.ObjectId(data.staff_id),
      leave_type: data.leave_type,
      from_date: data.from_date,
      to_date: data.to_date,
      total_days: data.total_days || 1,
      reason: data.reason,
      status: 'pending',
    });
    return leave.save();
  }

  async reviewLeave(id: string, reviewerId: string, status: 'approved' | 'rejected', remarks?: string) {
    const leave = await this.leaveModel.findByIdAndUpdate(
      id,
      {
        status,
        reviewed_by: new Types.ObjectId(reviewerId),
        review_remarks: remarks,
      },
      { new: true },
    );
    if (!leave) throw new NotFoundException('Leave request not found');
    return leave;
  }
}

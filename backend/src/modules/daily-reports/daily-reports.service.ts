import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DailyReport, DailyReportDocument } from '../../schemas/daily-report.schema';

@Injectable()
export class DailyReportsService {
  constructor(
    @InjectModel(DailyReport.name) private readonly reportModel: Model<DailyReportDocument>,
  ) {}

  async findAll(companyId?: string, userType?: string, date?: string) {
    const query: any = {};
    if (companyId) query.company_id = new Types.ObjectId(companyId);
    if (userType) query.user_type = userType;
    if (date) query.report_date = date;

    return this.reportModel.find(query).sort({ report_date: -1, createdAt: -1 });
  }

  async create(data: {
    company_id: string;
    user_type: 'staff' | 'student';
    entity_id: string;
    report_date: string;
    work_description: string;
    hours_spent?: number;
  }) {
    const report = new this.reportModel({
      company_id: new Types.ObjectId(data.company_id),
      user_type: data.user_type,
      entity_id: new Types.ObjectId(data.entity_id),
      report_date: data.report_date,
      work_description: data.work_description,
      hours_spent: data.hours_spent || 8,
      status: 'submitted',
    });
    return report.save();
  }

  async verify(id: string, verifierId: string, feedback?: string) {
    const updated = await this.reportModel.findByIdAndUpdate(
      id,
      {
        status: 'verified',
        verified_by: new Types.ObjectId(verifierId),
        feedback,
      },
      { new: true },
    );
    if (!updated) throw new NotFoundException('Daily report not found');
    return updated;
  }
}

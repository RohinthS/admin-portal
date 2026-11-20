import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Enquiry, EnquiryDocument, EnquiryFollowup, EnquiryFollowupDocument } from '../../schemas/enquiry.schema';

@Injectable()
export class EnquiryService {
  constructor(
    @InjectModel(Enquiry.name) private readonly enquiryModel: Model<EnquiryDocument>,
    @InjectModel(EnquiryFollowup.name) private readonly followupModel: Model<EnquiryFollowupDocument>,
  ) {}

  async findAll(companyId?: string, status?: string) {
    const query: any = {};
    if (companyId) query.company_id = new Types.ObjectId(companyId);
    if (status) query.status = status;

    return this.enquiryModel
      .find(query)
      .populate('course_id', 'course_name')
      .populate('assigned_to', 'staff_name')
      .sort({ createdAt: -1 });
  }

  async findById(id: string) {
    const enquiry = await this.enquiryModel
      .findById(id)
      .populate('course_id')
      .populate('assigned_to');
    if (!enquiry) throw new NotFoundException('Enquiry not found');

    const followups = await this.followupModel
      .find({ enquiry_id: new Types.ObjectId(id) })
      .populate('staff_id', 'staff_name')
      .sort({ followup_date: -1 });

    return { enquiry, followups };
  }

  async create(data: Partial<Enquiry>) {
    const enquiry = new this.enquiryModel({
      ...data,
      enquiry_date: new Date(),
      status: 'open',
    });
    return enquiry.save();
  }

  async update(id: string, data: Partial<Enquiry>) {
    const enquiry = await this.enquiryModel.findByIdAndUpdate(id, data, { new: true });
    if (!enquiry) throw new NotFoundException('Enquiry not found');
    return enquiry;
  }

  async addFollowup(enquiryId: string, data: { staff_id?: string; notes: string; next_followup_date?: Date; response_status?: string; new_enquiry_status?: string }) {
    const followup = new this.followupModel({
      enquiry_id: new Types.ObjectId(enquiryId),
      staff_id: data.staff_id ? new Types.ObjectId(data.staff_id) : undefined,
      notes: data.notes,
      next_followup_date: data.next_followup_date,
      response_status: data.response_status || 'contacted',
      followup_date: new Date(),
    });
    const saved = await followup.save();

    if (data.new_enquiry_status) {
      await this.enquiryModel.findByIdAndUpdate(enquiryId, { status: data.new_enquiry_status });
    }

    return saved;
  }

  async getWhatsAppMessageUrl(enquiryId: string) {
    const enquiry = await this.enquiryModel.findById(enquiryId).populate('course_id');
    if (!enquiry || !enquiry.phone) throw new NotFoundException('Enquiry or phone not found');

    const courseName = (enquiry.course_id as any)?.course_name || 'our training course';
    const message = encodeURIComponent(
      `Hello ${enquiry.student_name},\nThank you for inquiring about ${courseName} at WeGrow Academy. Let us know when you would like to schedule a free counseling session!`,
    );

    const cleanPhone = enquiry.phone.replace(/[^0-9]/g, '');
    return {
      phone: cleanPhone,
      message,
      whatsapp_url: `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${message}`,
    };
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Enrollment, EnrollmentDocument } from '../../schemas/enrollment.schema';
import { Receipt, ReceiptDocument } from '../../schemas/receipt.schema';

@Injectable()
export class EnrollmentService {
  constructor(
    @InjectModel(Enrollment.name) private readonly enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Receipt.name) private readonly receiptModel: Model<ReceiptDocument>,
  ) {}

  async findAll(companyId?: string, courseType?: string) {
    const query: any = { status: { $ne: 'deleted' } };
    if (companyId) query.company_id = new Types.ObjectId(companyId);
    if (courseType) query.course_type = courseType;

    return this.enrollmentModel
      .find(query)
      .populate('course_id', 'course_name fees')
      .populate('company_id', 'company_name branch')
      .sort({ createdAt: -1 });
  }

  async findById(id: string) {
    const enrollment = await this.enrollmentModel
      .findById(id)
      .populate('course_id')
      .populate('company_id');
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    return enrollment;
  }

  async create(data: {
    student_name: string;
    phone: string;
    email?: string;
    course_type: 'training' | 'internship';
    course_id: string;
    company_id: string;
    total_fees: number;
    discount?: number;
    net_fees: number;
    paid_amount: number;
    guardian_name?: string;
    guardian_phone?: string;
    address?: string;
    college_name?: string;
    qualification?: string;
  }) {
    const discount = data.discount || 0;
    const netFees = data.net_fees || data.total_fees - discount;
    const paidAmount = data.paid_amount || 0;
    const balanceAmount = Math.max(0, netFees - paidAmount);

    // Auto-generate unique enrollment number: ENR-YYYYMM-XXXX
    const count = await this.enrollmentModel.countDocuments();
    const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
    const enrollmentNo = `ENR-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    const newEnrollment = new this.enrollmentModel({
      enrollment_no: enrollmentNo,
      company_id: new Types.ObjectId(data.company_id),
      course_type: data.course_type,
      course_id: new Types.ObjectId(data.course_id),
      student_name: data.student_name.trim(),
      email: data.email?.trim(),
      phone: data.phone.trim(),
      guardian_name: data.guardian_name,
      guardian_phone: data.guardian_phone,
      address: data.address,
      college_name: data.college_name,
      qualification: data.qualification,
      total_fees: data.total_fees,
      discount,
      net_fees: netFees,
      paid_amount: paidAmount,
      balance_amount: balanceAmount,
      joining_date: new Date(),
      status: 'active',
    });

    const saved = await newEnrollment.save();

    // Workflow rule from requirements.md:
    // If paid_amount > 0, return trigger for frontend to automatically open receipt modal
    const autoOpenReceipt = paidAmount > 0;

    return {
      success: true,
      enrollment: saved,
      auto_open_receipt: autoOpenReceipt,
      receipt_initial_data: autoOpenReceipt
        ? {
            student_id: saved._id,
            enrollment_id: saved._id,
            student_name: saved.student_name,
            course_type: saved.course_type,
            paid_amount: saved.paid_amount,
            total_amount: saved.paid_amount,
            company_id: saved.company_id,
          }
        : null,
    };
  }

  async update(id: string, data: Partial<Enrollment>) {
    const enrollment = await this.enrollmentModel.findByIdAndUpdate(id, data, { new: true });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    return enrollment;
  }
}

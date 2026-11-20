import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Receipt, ReceiptDocument, PaymentSplit } from '../../schemas/receipt.schema';
import { Enrollment, EnrollmentDocument } from '../../schemas/enrollment.schema';
import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class ReceiptService {
  constructor(
    @InjectModel(Receipt.name) private readonly receiptModel: Model<ReceiptDocument>,
    @InjectModel(Enrollment.name) private readonly enrollmentModel: Model<EnrollmentDocument>,
    private readonly supabaseService: SupabaseService,
  ) {}

  async findAll(companyId?: string, enrollmentId?: string) {
    const query: any = { status: 1 };
    if (companyId) query.company_id = new Types.ObjectId(companyId);
    if (enrollmentId) query.enrollment_id = new Types.ObjectId(enrollmentId);

    return this.receiptModel
      .find(query)
      .populate('enrollment_id')
      .populate('company_id', 'company_name branch')
      .sort({ createdAt: -1 });
  }

  async findById(id: string) {
    const receipt = await this.receiptModel
      .findById(id)
      .populate('enrollment_id')
      .populate('company_id');
    if (!receipt) throw new NotFoundException('Receipt not found');
    return receipt;
  }

  async create(data: {
    enrollment_id: string;
    company_id: string;
    course_type: 'training' | 'internship';
    total_amount: number;
    payment_splits: PaymentSplit[];
    remarks?: string;
    created_by?: string;
  }) {
    if (!data.payment_splits || data.payment_splits.length === 0) {
      throw new BadRequestException('At least one payment mode split is mandatory');
    }

    // Strict validation: Sum of all split amounts must exactly equal total_amount
    const splitSum = data.payment_splits.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const expectedTotal = Number(data.total_amount);

    if (Math.abs(splitSum - expectedTotal) > 0.01) {
      throw new BadRequestException(
        `Total payment split (${splitSum}) must exactly match receipt total amount (${expectedTotal}).`,
      );
    }

    // Check enrollment exists
    const enrollment = await this.enrollmentModel.findById(data.enrollment_id);
    if (!enrollment) {
      throw new BadRequestException('Target enrollment record not found');
    }

    // Auto-generate receipt number: REC-YYYYMM-XXXX
    const count = await this.receiptModel.countDocuments();
    const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
    const receiptNo = `REC-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    const newReceipt = new this.receiptModel({
      receipt_no: receiptNo,
      enrollment_id: enrollment._id,
      company_id: new Types.ObjectId(data.company_id),
      course_type: data.course_type,
      total_amount: expectedTotal,
      payment_splits: data.payment_splits,
      remarks: data.remarks,
      created_by: data.created_by ? new Types.ObjectId(data.created_by) : undefined,
      receipt_date: new Date(),
      status: 1,
    });

    const saved = await newReceipt.save();

    // Link initial receipt to enrollment and sync paid / balance amounts
    const currentPaid = (enrollment.paid_amount || 0);
    if (!enrollment.initial_receipt_id) {
      enrollment.initial_receipt_id = saved._id;
    }
    enrollment.balance_amount = Math.max(0, (enrollment.net_fees || 0) - (enrollment.paid_amount || 0));
    await enrollment.save();

    // Sync to Supabase if configured
    await this.supabaseService.syncRecordToSupabase('tc_payment', {
      receipt_no: saved.receipt_no,
      enrollment_id: saved.enrollment_id.toString(),
      company_id: saved.company_id.toString(),
      total_amount: saved.total_amount,
      course_type: saved.course_type,
      payment_splits: JSON.stringify(saved.payment_splits),
    });

    return saved;
  }
}

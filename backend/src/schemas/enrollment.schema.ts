import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EnrollmentDocument = Enrollment & Document;

@Schema({ timestamps: true, collection: 'enrollments' })
export class Enrollment {
  @Prop({ required: true, unique: true, trim: true })
  enrollment_no: string;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company_id: Types.ObjectId;

  @Prop({ required: true, enum: ['training', 'internship'] })
  course_type: string;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  course_id: Types.ObjectId;

  // Student Details
  @Prop({ required: true, trim: true })
  student_name: string;

  @Prop({ trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop()
  guardian_name: string;

  @Prop()
  guardian_phone: string;

  @Prop()
  address: string;

  @Prop()
  college_name: string;

  @Prop()
  qualification: string;

  // Financials
  @Prop({ required: true, default: 0 })
  total_fees: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ required: true, default: 0 })
  net_fees: number;

  @Prop({ default: 0 })
  paid_amount: number;

  @Prop({ default: 0 })
  balance_amount: number;

  @Prop({ type: Date, default: Date.now })
  joining_date: Date;

  @Prop({ default: 'active', enum: ['active', 'completed', 'dropped', 'on_hold'] })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Receipt' })
  initial_receipt_id?: Types.ObjectId;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);

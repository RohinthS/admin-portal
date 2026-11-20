import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PayrollDocument = Payroll & Document;

@Schema({ timestamps: true, collection: 'payroll' })
export class Payroll {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Staff', required: true })
  staff_id: Types.ObjectId;

  @Prop({ required: true })
  month: number; // 1-12

  @Prop({ required: true })
  year: number;

  @Prop({ required: true, default: 0 })
  basic_salary: number;

  @Prop({ default: 0 })
  allowances: number;

  @Prop({ default: 0 })
  deductions: number;

  @Prop({ required: true, default: 0 })
  net_salary: number;

  @Prop({ default: 'unpaid', enum: ['unpaid', 'paid', 'hold'] })
  payment_status: string;

  @Prop({ type: Date })
  payment_date?: Date;

  @Prop()
  payment_mode?: string;

  @Prop()
  payslip_url?: string;
}

export const PayrollSchema = SchemaFactory.createForClass(Payroll);
PayrollSchema.index({ company_id: 1, staff_id: 1, month: 1, year: 1 }, { unique: true });

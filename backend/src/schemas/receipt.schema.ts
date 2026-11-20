import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export class PaymentSplit {
  @Prop({ required: true, enum: ['cash', 'card', 'upi', 'bank_transfer', 'cheque'] })
  mode: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop()
  reference_no?: string;

  @Prop({ type: Types.ObjectId, ref: 'Bank' })
  bank_id?: Types.ObjectId;
}

export type ReceiptDocument = Receipt & Document;

@Schema({ timestamps: true, collection: 'receipts' })
export class Receipt {
  @Prop({ required: true, unique: true, trim: true })
  receipt_no: string;

  @Prop({ type: Types.ObjectId, ref: 'Enrollment', required: true })
  enrollment_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company_id: Types.ObjectId;

  @Prop({ required: true, enum: ['training', 'internship'] })
  course_type: string;

  @Prop({ required: true, min: 0 })
  total_amount: number;

  @Prop({ type: [PaymentSplit], required: true, default: [] })
  payment_splits: PaymentSplit[];

  @Prop({ type: Date, default: Date.now })
  receipt_date: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  created_by: Types.ObjectId;

  @Prop()
  remarks?: string;

  @Prop({ default: 1 })
  status: number;
}

export const ReceiptSchema = SchemaFactory.createForClass(Receipt);

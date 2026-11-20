import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InstallmentDocument = Installment & Document;

@Schema({ timestamps: true, collection: 'installments' })
export class Installment {
  @Prop({ type: Types.ObjectId, ref: 'Enrollment', required: true })
  enrollment_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company_id: Types.ObjectId;

  @Prop({ required: true })
  installment_no: number;

  @Prop({ required: true })
  due_amount: number;

  @Prop({ required: true })
  due_date: Date;

  @Prop({ default: 0 })
  paid_amount: number;

  @Prop({ default: 'pending', enum: ['pending', 'partially_paid', 'paid', 'overdue'] })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Receipt' })
  receipt_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Staff' })
  followup_assigned_to?: Types.ObjectId;
}

export const InstallmentSchema = SchemaFactory.createForClass(Installment);

export type InstallmentFollowupHistoryDocument = InstallmentFollowupHistory & Document;

@Schema({ timestamps: true, collection: 'installment_followup_histories' })
export class InstallmentFollowupHistory {
  @Prop({ type: Types.ObjectId, ref: 'Installment', required: true })
  installment_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Staff', required: true })
  staff_id: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  followup_date: Date;

  @Prop({ type: Date })
  next_promise_date?: Date;

  @Prop({ required: true })
  remarks: string;

  @Prop({ default: 'contacted' })
  status: string;
}

export const InstallmentFollowupHistorySchema = SchemaFactory.createForClass(InstallmentFollowupHistory);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CreditTransactionDocument = CreditTransaction & Document;

@Schema({ timestamps: true, collection: 'credit_transactions' })
export class CreditTransaction {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  student_id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  category: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, default: 0 })
  credits: number;

  @Prop({ required: true, default: 'Admin' })
  awarded_by: string;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ trim: true })
  source_id?: string;

  @Prop({ trim: true })
  date?: string;

  // Certificate Verification Fields
  @Prop({ default: false })
  certificateVerified?: boolean;

  @Prop({ trim: true })
  certificateTitle?: string;

  @Prop({ trim: true })
  certificateNumber?: string;

  @Prop({ trim: true })
  certificateDate?: string;

  @Prop({ trim: true })
  certificateFileUrl?: string;
}

export const CreditTransactionSchema = SchemaFactory.createForClass(CreditTransaction);
CreditTransactionSchema.index({ student_id: 1, createdAt: -1 });
CreditTransactionSchema.index({ company_id: 1 });
CreditTransactionSchema.index({ student_id: 1, source_id: 1 });


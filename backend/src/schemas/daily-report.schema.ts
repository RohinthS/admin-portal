import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DailyReportDocument = DailyReport & Document;

@Schema({ timestamps: true, collection: 'daily_reports' })
export class DailyReport {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company_id: Types.ObjectId;

  @Prop({ required: true, enum: ['staff', 'student'] })
  user_type: string;

  @Prop({ type: Types.ObjectId, required: true })
  entity_id: Types.ObjectId; // staff_id or student enrollment_id

  @Prop({ required: true })
  report_date: string; // YYYY-MM-DD

  @Prop({ required: true })
  work_description: string;

  @Prop({ default: 8 })
  hours_spent: number;

  @Prop({ default: 'submitted', enum: ['submitted', 'verified', 'needs_revision'] })
  status: string;

  @Prop()
  verified_by?: Types.ObjectId;

  @Prop()
  feedback?: string;
}

export const DailyReportSchema = SchemaFactory.createForClass(DailyReport);

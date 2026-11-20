import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LeaveRequestDocument = LeaveRequest & Document;

@Schema({ timestamps: true, collection: 'staff_leave_requests' })
export class LeaveRequest {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Staff', required: true })
  staff_id: Types.ObjectId;

  @Prop({ required: true, enum: ['casual', 'sick', 'earned', 'unpaid'] })
  leave_type: string;

  @Prop({ required: true })
  from_date: string;

  @Prop({ required: true })
  to_date: string;

  @Prop({ required: true, default: 1 })
  total_days: number;

  @Prop({ required: true })
  reason: string;

  @Prop({ default: 'pending', enum: ['pending', 'approved', 'rejected'] })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewed_by?: Types.ObjectId;

  @Prop()
  review_remarks?: string;
}

export const LeaveRequestSchema = SchemaFactory.createForClass(LeaveRequest);

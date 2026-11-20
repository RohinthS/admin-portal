import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EnquiryDocument = Enquiry & Document;

@Schema({ timestamps: true, collection: 'course_enquiries' })
export class Enquiry {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company_id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  student_name: string;

  @Prop({ trim: true })
  phone: string;

  @Prop({ trim: true })
  email: string;

  @Prop({ type: Types.ObjectId, ref: 'Course' })
  course_id: Types.ObjectId;

  @Prop({ default: 'walk_in', enum: ['walk_in', 'call', 'website', 'referral', 'social_media'] })
  source: string;

  @Prop({ default: 'open', enum: ['open', 'in_progress', 'converted', 'closed', 'lost'] })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Staff' })
  assigned_to: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  enquiry_date: Date;

  @Prop()
  notes: string;
}

export const EnquirySchema = SchemaFactory.createForClass(Enquiry);

export type EnquiryFollowupDocument = EnquiryFollowup & Document;

@Schema({ timestamps: true, collection: 'enquiry_followups' })
export class EnquiryFollowup {
  @Prop({ type: Types.ObjectId, ref: 'Enquiry', required: true })
  enquiry_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Staff' })
  staff_id: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  followup_date: Date;

  @Prop({ type: Date })
  next_followup_date: Date;

  @Prop({ required: true })
  notes: string;

  @Prop({ default: 'interested' })
  response_status: string;
}

export const EnquiryFollowupSchema = SchemaFactory.createForClass(EnquiryFollowup);

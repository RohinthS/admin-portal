import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EventDocument = Event & Document;

@Schema({ timestamps: true, collection: 'events' })
export class Event {
  @Prop({ type: Types.ObjectId, ref: 'Company' })
  company_id?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  start_date: Date;

  @Prop({ required: true })
  end_date: Date;

  @Prop({ trim: true })
  category: string;

  @Prop({ default: 0 })
  discount_percentage?: number;

  @Prop({ default: 1 })
  status: number;
}

export const EventSchema = SchemaFactory.createForClass(Event);

export type FeedbackDocument = Feedback & Document;

@Schema({ timestamps: true, collection: 'student_feedback' })
export class Feedback {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Enrollment', required: true })
  student_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course' })
  course_id: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true })
  feedback_text: string;

  @Prop({ default: 'approved' })
  status: string;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);

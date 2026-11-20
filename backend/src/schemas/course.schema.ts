import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CourseDocument = Course & Document;

@Schema({ timestamps: true, collection: 'courses' })
export class Course {
  @Prop({ required: true, trim: true })
  course_name: string;

  @Prop({ trim: true })
  course_code: string;

  @Prop({ default: 0 })
  duration_days: number;

  @Prop({ default: 0 })
  fees: number;

  @Prop({ default: 0 })
  gst_percentage: number;

  @Prop()
  syllabus: string;

  @Prop({ default: 1 })
  status: number;
}

export const CourseSchema = SchemaFactory.createForClass(Course);

export type CourseClosureDocument = CourseClosure & Document;

@Schema({ timestamps: true, collection: 'course_closures' })
export class CourseClosure {
  @Prop({ type: Types.ObjectId, ref: 'Enrollment', required: true })
  enrollment_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company_id: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  closure_date: Date;

  @Prop({ default: 'completed', enum: ['completed', 'dropped', 'on_hold'] })
  closure_status: string;

  @Prop()
  certificate_no: string;

  @Prop()
  remarks: string;

  @Prop({ default: 1 })
  status: number;
}

export const CourseClosureSchema = SchemaFactory.createForClass(CourseClosure);

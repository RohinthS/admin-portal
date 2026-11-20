import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AttendanceDocument = Attendance & Document;

@Schema({ timestamps: true, collection: 'attendance' })
export class Attendance {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company_id: Types.ObjectId;

  @Prop({ required: true, enum: ['staff', 'student'] })
  user_type: string;

  @Prop({ type: Types.ObjectId, required: true })
  entity_id: Types.ObjectId; // staff_id or student enrollment_id

  @Prop({ required: true })
  attendance_date: string; // YYYY-MM-DD

  @Prop()
  in_time?: string;

  @Prop()
  out_time?: string;

  @Prop({ required: true, enum: ['present', 'absent', 'half_day', 'holiday', 'leave'] })
  status: string;

  @Prop()
  remarks?: string;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);
AttendanceSchema.index({ company_id: 1, entity_id: 1, attendance_date: 1 }, { unique: true });

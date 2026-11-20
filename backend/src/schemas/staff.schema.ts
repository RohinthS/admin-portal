import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StaffDocument = Staff & Document;

@Schema({ timestamps: true, collection: 'staff' })
export class Staff {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  user_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company_id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  staff_name: string;

  @Prop({ trim: true })
  emp_code: string;

  @Prop({ trim: true })
  email: string;

  @Prop({ trim: true })
  phone: string;

  @Prop()
  designation: string;

  @Prop()
  department: string;

  @Prop({ default: 0 })
  salary: number;

  @Prop()
  doj: Date;

  @Prop()
  dob: Date;

  @Prop()
  address: string;

  @Prop({ default: 1 })
  status: number;
}

export const StaffSchema = SchemaFactory.createForClass(Staff);

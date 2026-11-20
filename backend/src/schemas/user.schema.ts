import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, unique: true, trim: true })
  username: string;

  @Prop({ required: true })
  password_hash: string;

  @Prop({ trim: true })
  name: string;

  @Prop({ trim: true })
  email: string;

  @Prop({ trim: true })
  phone: string;

  @Prop({ type: String, default: 'staff', enum: ['admin', 'director', 'manager', 'staff', 'student'] })
  user_type: string;

  @Prop({ type: Types.ObjectId, ref: 'Role' })
  role_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company' })
  company_id: Types.ObjectId;

  @Prop({ default: 1 })
  status: number; // 1 = Active, 0 = Inactive

  @Prop()
  avatar?: string;

  @Prop()
  last_login?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

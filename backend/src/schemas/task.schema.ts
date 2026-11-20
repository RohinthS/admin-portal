import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export class TaskComment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author_id: Types.ObjectId;

  @Prop({ required: true })
  comment: string;

  @Prop({ type: Date, default: Date.now })
  created_at: Date;
}

export type TaskDocument = Task & Document;

@Schema({ timestamps: true, collection: 'tasks' })
export class Task {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company_id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true, enum: ['staff', 'student'] })
  task_for: string;

  @Prop({ type: Types.ObjectId, required: true })
  assigned_to: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assigned_by: Types.ObjectId;

  @Prop({ type: Date })
  due_date: Date;

  @Prop({ default: 'medium', enum: ['low', 'medium', 'high', 'urgent'] })
  priority: string;

  @Prop({ default: 'pending', enum: ['pending', 'in_progress', 'completed', 'verified'] })
  status: string;

  @Prop({ type: [TaskComment], default: [] })
  comments: TaskComment[];
}

export const TaskSchema = SchemaFactory.createForClass(Task);

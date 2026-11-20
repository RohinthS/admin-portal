import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuestionDocument = Question & Document;

@Schema({ timestamps: true, collection: 'questions' })
export class Question {
  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  course_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'QuestionSet' })
  set_id?: Types.ObjectId;

  @Prop({ default: 'mcq' })
  type: string; // 'mcq' | 'multiple_correct' | 'find_output' | 'true_false' | 'fill_blanks' | 'short_answer' | 'coding'

  @Prop({ required: true })
  question_text: string;

  @Prop({ type: [String], default: [] })
  options: string[];

  @Prop({ type: Object, default: 0 })
  correct_answer: any;

  @Prop({ default: 0 })
  correct_option_index: number;

  @Prop({ default: 1 })
  marks: number;

  @Prop({ default: 0 })
  negative_marks: number;

  @Prop()
  code_snippet?: string;

  @Prop()
  coding_language?: string;

  @Prop({ type: Array, default: [] })
  test_cases?: Array<{ input: string; expected_output: string; is_hidden?: boolean }>;

  @Prop()
  explanation?: string;

  @Prop({ default: 'General' })
  topic?: string;

  @Prop()
  subtopic?: string;

  @Prop({ default: 'medium' })
  difficulty?: string;

  @Prop({ default: 1 })
  status: number;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

export type QuestionSetDocument = QuestionSet & Document;

@Schema({ timestamps: true, collection: 'question_sets' })
export class QuestionSet {
  @Prop({ required: true, trim: true })
  set_name: string;

  @Prop({ trim: true })
  title?: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  course_id: Types.ObjectId;

  @Prop({ default: 'All Batches' })
  batch?: string;

  @Prop({ default: 'internal' })
  category: string; // 'internal' | 'overall' | 'practice' | 'retake'

  @Prop({ default: 1 })
  month_number?: number;

  @Prop({ default: 'monthly_test' })
  credit_category_id: string;

  @Prop({ default: 30 })
  duration_minutes: number;

  @Prop({ default: 60 })
  pass_percentage: number;

  @Prop({ default: 0 })
  negative_marking_per_question: number;

  @Prop({ type: Array, default: [] })
  credit_tiers: Array<{ min_percentage: number; max_percentage: number; credits: number }>;

  @Prop({ default: 'instant' })
  publishing_mode: string; // 'instant' | 'pin_protected' | 'scheduled'

  @Prop()
  secret_key?: string;

  @Prop({ default: false })
  is_secret_key_required: boolean;

  @Prop()
  secret_key_expiry?: Date;

  @Prop()
  start_date?: Date;

  @Prop()
  end_date?: Date;

  @Prop({ default: true })
  shuffle_questions: boolean;

  @Prop({ default: true })
  shuffle_options: boolean;

  @Prop({ default: 1 })
  max_attempts: number;

  @Prop({ default: 3 })
  max_violations: number;

  @Prop({ default: 'immediate' })
  result_visibility: string;

  @Prop()
  result_release_date?: Date;

  @Prop({ default: false })
  is_answer_key_released: boolean;

  @Prop()
  answer_key_released_at?: Date;

  @Prop()
  answer_key_released_by?: string;

  @Prop({ default: 0 })
  total_marks?: number;

  @Prop({ default: 0 })
  total_questions?: number;

  @Prop({ default: 'Admin' })
  created_by?: string;

  @Prop({ default: 'admin' })
  creator_role?: string;

  @Prop({ default: false })
  is_retake_allowed: boolean;

  @Prop({ type: [String], default: [] })
  unlocked_student_ids?: string[];

  @Prop({ default: 1 })
  status: number;
}

export const QuestionSetSchema = SchemaFactory.createForClass(QuestionSet);

export type TestAttemptDocument = TestAttempt & Document;

@Schema({ timestamps: true, collection: 'test_attempts' })
export class TestAttempt {
  @Prop({ type: Types.ObjectId, ref: 'Enrollment', required: false })
  student_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  user_id?: Types.ObjectId;

  @Prop({ trim: true })
  student_name?: string;

  @Prop({ trim: true })
  course_name?: string;

  @Prop({ trim: true })
  batch?: string;

  @Prop({ type: Types.ObjectId, ref: 'QuestionSet', required: true })
  set_id: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  start_time: Date;

  @Prop({ type: Date })
  end_time: Date;

  @Prop({ default: 0 })
  total_questions: number;

  @Prop({ default: 0 })
  correct_count: number;

  @Prop({ default: 0 })
  marks_obtained: number;

  @Prop({ default: 0 })
  total_marks: number;

  @Prop({ default: 0 })
  score_percentage: number;

  @Prop({ default: false })
  is_passed: boolean;

  @Prop({ default: 0 })
  earned_credits: number;

  @Prop({ default: 0 })
  violations_count: number;

  @Prop({ type: Array, default: [] })
  violations_log: Array<{ timestamp: string; type: string; description: string }>;

  @Prop({ default: false })
  is_disqualified?: boolean;

  @Prop()
  disqualified_reason?: string;

  @Prop({ default: 'in_progress' })
  status: string; // 'in_progress' | 'submitted' | 'disqualified'

  @Prop({ type: Array, default: [] })
  answers: Array<{ question_id: Types.ObjectId; selected_option: any; is_correct: boolean }>;
}

export const TestAttemptSchema = SchemaFactory.createForClass(TestAttempt);

export type BatchModuleProgressionDocument = BatchModuleProgression & Document;

@Schema({ timestamps: true, collection: 'batch_module_progressions' })
export class BatchModuleProgression {
  @Prop({ required: true, trim: true })
  course_name: string;

  @Prop({ required: true, trim: true })
  batch_name: string; // 'Morning Batch' | 'Afternoon Batch' | 'Evening Batch'

  @Prop({ required: true, trim: true })
  module_id: string;

  @Prop({ required: true, trim: true })
  module_name: string;

  @Prop({ required: true, default: 'pending', enum: ['pending', 'completed'] })
  status: string; // 'pending' | 'completed'

  @Prop({ type: Date })
  completed_at?: Date;

  @Prop({ trim: true })
  completed_by?: string;

  @Prop({ type: Types.ObjectId, ref: 'QuestionSet' })
  test_id?: Types.ObjectId;

  @Prop({ default: false })
  is_test_published: boolean;
}

export const BatchModuleProgressionSchema = SchemaFactory.createForClass(BatchModuleProgression);

export type AdminAuditLogDocument = AdminAuditLog & Document;

@Schema({ timestamps: true, collection: 'admin_audit_logs' })
export class AdminAuditLog {
  @Prop({ required: true })
  action: string; // 'manual_unlock' | 'reset_attempt' | 'override_pass'

  @Prop({ required: true })
  performed_by: string;

  @Prop()
  student_id?: string;

  @Prop()
  student_name?: string;

  @Prop()
  course_name?: string;

  @Prop()
  batch_name?: string;

  @Prop()
  module_id?: string;

  @Prop()
  reason?: string;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;
}

export const AdminAuditLogSchema = SchemaFactory.createForClass(AdminAuditLog);

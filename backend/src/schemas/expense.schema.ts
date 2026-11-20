import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExpenseCategoryDocument = ExpenseCategory & Document;

@Schema({ timestamps: true, collection: 'expense_categories' })
export class ExpenseCategory {
  @Prop({ required: true, trim: true })
  category_name: string;

  @Prop()
  description: string;

  @Prop({ default: 1 })
  status: number;
}

export const ExpenseCategorySchema = SchemaFactory.createForClass(ExpenseCategory);

export type ExpenseEntryDocument = ExpenseEntry & Document;

@Schema({ timestamps: true, collection: 'expense_entries' })
export class ExpenseEntry {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ExpenseCategory', required: true })
  category_id: Types.ObjectId;

  @Prop({ required: true })
  expense_date: string; // YYYY-MM-DD

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, enum: ['cash', 'bank', 'upi', 'card'] })
  payment_mode: string;

  @Prop()
  reference_no: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  receipt_attachment?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  created_by: Types.ObjectId;
}

export const ExpenseEntrySchema = SchemaFactory.createForClass(ExpenseEntry);

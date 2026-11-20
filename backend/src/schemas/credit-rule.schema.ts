import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export class DynamicCreditItem {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, default: 0 })
  credits: number;

  @Prop({ default: false })
  hasThreshold: boolean;

  @Prop()
  thresholdLabel?: string;

  @Prop({ default: 0 })
  thresholdValue?: number;
}

export class DynamicCategoryGroup {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ default: 'Award' })
  iconName?: string;

  @Prop({ type: [DynamicCreditItem], default: [] })
  items: DynamicCreditItem[];
}

export type CreditRuleDocument = CreditRule & Document;

@Schema({ timestamps: true, collection: 'credit_rules' })
export class CreditRule {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, unique: true })
  company_id: Types.ObjectId;

  @Prop({ type: [DynamicCategoryGroup], default: [] })
  categories: DynamicCategoryGroup[];
}

export const CreditRuleSchema = SchemaFactory.createForClass(CreditRule);


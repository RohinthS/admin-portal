import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CompanyDocument = Company & Document;

@Schema({ timestamps: true, collection: 'companies' })
export class Company {
  @Prop({ required: true, trim: true })
  company_name: string;

  @Prop({ required: true, trim: true })
  branch: string;

  @Prop()
  address: string;

  @Prop()
  phone: string;

  @Prop()
  email: string;

  @Prop()
  gst_number: string;

  @Prop()
  logo: string;

  @Prop({ default: 1 })
  status: number;
}

export const CompanySchema = SchemaFactory.createForClass(Company);

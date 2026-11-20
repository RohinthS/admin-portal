import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoleDocument = Role & Document;

@Schema({ timestamps: true, collection: 'roles' })
export class Role {
  @Prop({ required: true, trim: true })
  role_name: string;

  @Prop()
  description: string;

  @Prop({ default: 1 })
  status: number;
}

export const RoleSchema = SchemaFactory.createForClass(Role);

export type RolePermissionDocument = RolePermission & Document;

@Schema({ timestamps: true, collection: 'role_permissions' })
export class RolePermission {
  @Prop({ type: Types.ObjectId, ref: 'Role', required: true })
  role_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company_id: Types.ObjectId;

  @Prop({ required: true })
  permission_page: string;

  // Raw action string: e.g. "V$$A$$E$$D"
  @Prop({ required: true })
  permission_action: string;

  // Normalized actions array: ['V', 'A', 'E', 'D']
  @Prop({ type: [String], default: [] })
  actions: string[];
}

export const RolePermissionSchema = SchemaFactory.createForClass(RolePermission);
RolePermissionSchema.index({ role_id: 1, company_id: 1, permission_page: 1 }, { unique: true });

import { Schema, model, Types } from 'mongoose';

export interface ICustomComponent {
  ownerId: Types.ObjectId;
  name: string;
  baseType: string;
  scope: 'personal' | 'team' | 'public';
  defaultConfig: { nodes: unknown[]; edges: unknown[] };
  version: number;
  usageCount: number;
  usedProjectIds: Types.ObjectId[];
}

const customComponentSchema = new Schema<ICustomComponent>({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  baseType: { type: String, required: true, trim: true, maxlength: 40 },
  scope: { type: String, enum: ['personal', 'team', 'public'], default: 'personal' },
  defaultConfig: {
    nodes: { type: [Schema.Types.Mixed], default: [] },
    edges: { type: [Schema.Types.Mixed], default: [] },
  },
  version: { type: Number, default: 1, min: 1 },
  usageCount: { type: Number, default: 0, min: 0 },
  usedProjectIds: { type: [Schema.Types.ObjectId], default: [] },
}, { timestamps: true });

export const CustomComponent = model<ICustomComponent>('CustomComponent', customComponentSchema);

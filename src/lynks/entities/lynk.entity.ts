import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LynkDocument = Lynk & Document;

export enum LynkStatus {
  ACTIVE = 'ACTIVE',
  MUTED = 'MUTED',
  BLOCKED = 'BLOCKED',
  ARCHIVED = 'ARCHIVED',
}

@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
})
export class Lynk {
  @Prop({ type: String, required: true, index: true })
  id: string; // public UUID (separate from _id) – good for URLs & MQTT topics

  @Prop({ type: [String], required: true, validate: [arrayLenTwo, 'Lynk must have exactly 2 participants'], index: true })
  participantIds: string[]; // references Person ids

  @Prop({ type: String, enum: LynkStatus, default: LynkStatus.ACTIVE, index: true })
  status: LynkStatus;

  @Prop({ type: String, default: 'default' })
  worldTemplateId: string; // template key/id (cosmic, snow, etc.)

  @Prop({ type: Number, default: 0 })
  xp: number;

  @Prop({ type: Number, default: 1 })
  level: number;

  @Prop({ type: Date, default: null })
  lastTexAt: Date | null;

  @Prop({ type: Map, of: Number, default: {} })
  unreadCountByUser: Map<string, number>; // participantId -> unread count

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

// Custom validator
function arrayLenTwo(value: string[]) {
  return Array.isArray(value) && value.length === 2;
}

export const LynkSchema = SchemaFactory.createForClass(Lynk);

// Helpful indices
LynkSchema.index({ participantIds: 1, status: 1 });
LynkSchema.index({ id: 1 }, { unique: true });

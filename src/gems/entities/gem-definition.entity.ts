import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type GemDefinitionDocument = GemDefinition & Document;

export enum GemCategory {
  CURRENCY = "CURRENCY", // pure balance
  GIFT = "GIFT",         // gift gem (heart, comet, etc.)
}

@Schema({
  timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
})
export class GemDefinition {
  @Prop({ type: String, required: true, unique: true })
  id: string; // public id used everywhere (e.g. "gift_heart_v1")

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, enum: GemCategory, required: true, index: true })
  category: GemCategory;

  @Prop({ type: String, default: null })
  iconKey?: string; // frontend icon/animation key

  // For GIFT: how many "gems" it costs to send this gift
  // For CURRENCY: optional value (e.g. real money mapping)
  @Prop({ type: Number, default: 0 })
  gemCost?: number;

  @Prop({ type: Boolean, default: true, index: true })
  isActive: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const GemDefinitionSchema =
  SchemaFactory.createForClass(GemDefinition);

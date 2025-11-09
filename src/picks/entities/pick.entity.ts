import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class Pick extends Document {
  @Prop({ required: true })
  personId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string; // 'avatar', 'profile', 'chat', etc.

  @Prop({ type: Object })
  config?: Record<string, any>; // e.g. avatar options or profile colors

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: "IN_PROGRESS" })
  state: string;

  @Prop({ required: true })
  price: number;

  @Prop({ type: Object })
  meta?: Record<string, any>;

  @Prop({ type: Number })
  createdAt?: number;

  @Prop({ type: Number })
  updatedAt?: number;
  gender: string;
}

export const PickSchema = SchemaFactory.createForClass(Pick);

PickSchema.pre<Pick>('save', function (next) {
  const now = Date.now();
  if (!this.createdAt) this.createdAt = now;
  this.updatedAt = now;
  next();
});


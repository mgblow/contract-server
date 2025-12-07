import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type GemPickupDocument = GemPickup & Document;

@Schema({
  timestamps: { createdAt: "createdAt", updatedAt: false },
})
export class GemPickup {
  @Prop({ type: String, required: true, unique: true })
  id: string; // public uuid

  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String, required: true, index: true })
  spawnId: string;

  @Prop({ type: String, required: true })
  definitionId: string;

  @Prop({ type: Number, required: true })
  amount: number; // how many gems credited

  @Prop({
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      index: "2dsphere",
    },
  })
  userLocation: {
    type: "Point";
    coordinates: [number, number];
  };

  @Prop()
  createdAt: Date;
}

export const GemPickupSchema = SchemaFactory.createForClass(GemPickup);

GemPickupSchema.index({ userId: 1, createdAt: -1 });
GemPickupSchema.index({ spawnId: 1, createdAt: -1 });

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type GemSpawnDocument = GemSpawn & Document;

@Schema({
  timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
})
export class GemSpawn {
  @Prop({ type: String, required: true, unique: true })
  id: string; // public id

  @Prop({ type: String, ref: "GemDefinition", required: true, index: true })
  definitionId: string;

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
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };

  // How many times this spawn can be picked in total
  @Prop({ type: Number, required: true })
  totalQuantity: number;

  // How many picks are still possible
  @Prop({ type: Number, required: true })
  remainingQuantity: number;

  // Max radius (meters) from the spawn location to be allowed to pick
  @Prop({ type: Number, default: 50 })
  pickupRadiusMeters: number;

  @Prop({ type: Date, default: null })
  startsAt?: Date | null;

  @Prop({ type: Date, default: null })
  expiresAt?: Date | null;

  @Prop({ type: Boolean, default: true, index: true })
  isActive: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const GemSpawnSchema = SchemaFactory.createForClass(GemSpawn);

GemSpawnSchema.index({ location: "2dsphere" });
GemSpawnSchema.index({ definitionId: 1, isActive: 1 });

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type TexDocument = Tex & Document;

@Schema({
  timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
})
export class Tex extends Document {
  @Prop({ type: String, ref: "Person", index: true })
  userId: string;

  @Prop({ type: String, ref: "Topic", index: true })
  topicId: string;

  @Prop({ required: true })
  text: string;

  @Prop({
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: "2dsphere",
    },
  })
  location?: {
    type: "Point";
    coordinates: [number, number];
  };

  // 🔹 Whether this tex should be visible globally on the public globe
  @Prop({ type: Boolean, default: true, index: true })
  isPublic: boolean;

  // 🔹 Gift system
  @Prop({ type: String, default: null, index: true })
  giftId?: string | null; // catalog gift id (heart, comet, neon gem, etc.)

  // how many gems were spent on this tex (for highlighting / economy)
  @Prop({ type: Number, default: 0 })
  gemValue?: number;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const TexSchema = SchemaFactory.createForClass(Tex);

// Indexes
TexSchema.index({ location: "2dsphere" });
TexSchema.index({ userId: 1, createdAt: -1 });
TexSchema.index({ topicId: 1, createdAt: -1 });
TexSchema.index({ giftId: 1, createdAt: -1 });

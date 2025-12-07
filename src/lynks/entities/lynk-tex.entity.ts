import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LynkTexDocument = LynkTex & Document;

@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: false },
})
export class LynkTex {
  @Prop({ type: String, required: true, index: true })
  id: string; // public UUID

  @Prop({ type: String, required: true, index: true })
  lynkId: string;

  @Prop({ type: String, required: true, index: true })
  senderId: string; // Person.id

  @Prop({ type: String, required: true })
  text: string;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [lng, lat]
      index: '2dsphere',
    },
  })
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };

  @Prop({ type: String, default: null })
  giftId?: string | null; // reference to Gift catalog

  @Prop({ type: Date })
  createdAt: Date;
}

export const LynkTexSchema = SchemaFactory.createForClass(LynkTex);

// Indices
LynkTexSchema.index({ lynkId: 1, createdAt: -1 });
LynkTexSchema.index({ senderId: 1, createdAt: -1 });

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class Tex extends Document {

  @Prop({ type: String, ref: "Person" })
  userId: string;

  @Prop({ type: String, ref: "Topic" })
  topicId: string;

  @Prop({ required: true })
  text: string;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  })
  location: {
    type: string;
    coordinates: number[];
  };
}

export const TexSchema = SchemaFactory.createForClass(Tex);

// Create 2dsphere index for geospatial queries
TexSchema.index({ location: '2dsphere' });
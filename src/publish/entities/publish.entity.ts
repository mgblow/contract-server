import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class Publish extends Document {

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

export const PublishSchema = SchemaFactory.createForClass(Publish);

// Create 2dsphere index for geospatial queries
PublishSchema.index({ location: '2dsphere' });
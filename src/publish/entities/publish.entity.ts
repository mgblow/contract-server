import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class Publish extends Document {

  @Prop({ type: String, ref: "Person" })
  userId: string;

  @Prop({ type: String, ref: "Category" })
  categoryId: string;

  @Prop({ type: [{ type: String }] })
  options: string[];

  @Prop({ type: [{ type: String }] })
  media: string[];

  @Prop({ required: true })
  text: string;

  @Prop({ type: String })
  type: string;

  @Prop({ type: [{ type: String }] })
  tags: string[];

  @Prop({ type: Number })
  price: number;

  @Prop({ type: String })
  status: string;

  // Location fields
  @Prop({ type: String })
  address: string;

  @Prop({ type: String })
  city: string;

  @Prop({ type: String })
  state: string;

  @Prop({ type: String })
  country: string;

  @Prop({ type: String })
  zipCode: string;

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
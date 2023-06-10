import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class Business extends Document {

  @Prop({ type: String })
  userId: string;

  @Prop({ type: String, ref: "Category" })
  categoryId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: String })
  about: string;

  @Prop({ type: String })
  website: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  logoUrl: string;

  @Prop({ type: String })
  coverImageUrl: string;

  @Prop({ type: [{ type: String }] })
  phoneNumbers: string[];

  @Prop({ type: [{ type: String }] })
  emailAddresses: string[];

  @Prop({ type: [{ type: String }] })
  addresses: string[];

  @Prop({ type: [{ type: String }] })
  socialMediaHandles: string[];
}

export const BusinessSchema = SchemaFactory.createForClass(Business);

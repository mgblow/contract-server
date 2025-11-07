import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class Contract extends Document {

  @Prop({ type: String, ref: "User" })
  userId: string;

  @Prop({ type: String, ref: "Category" })
  categoryId: string;

  @Prop({ type: [{ type: String }] })
  options: string[];

  @Prop({ type: [{ type: String }] })
  media: string[];

  @Prop({ required: true })
  name: string;

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

  @Prop({ type: String })
  tokenId?: string;

  @Prop({ type: Object })
  location?: {
    world: string;
    x: number;
    y: number;
    z: number;
  };
}

export const ContractSchema = SchemaFactory.createForClass(Contract);

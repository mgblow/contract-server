import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class Label extends Document {

  @Prop({ type: String })
  userId: string;

  @Prop({ type: String, ref: "Box" })
  boxId: string;
}

export const LabelSchema = SchemaFactory.createForClass(Label);

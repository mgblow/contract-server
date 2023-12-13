import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class Message extends Document {

  @Prop({ type: String, ref: "User" })
  senderUserId: string;

  @Prop({ type: String, ref: "User" })
  receiverUserId: string;

  @Prop({ type: [{ type: String }] })
  file: string;

  @Prop({ required: true })
  text: string;

  @Prop({ type: Boolean })
  read: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

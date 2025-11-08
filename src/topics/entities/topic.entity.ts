import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type TopicDocument = HydratedDocument<Topic>;

@Schema({ timestamps: true })
export class Topic {

  _id: Object;

  @Prop({ type: String, ref: "Person" })
  userId: string;

  @Prop()
  name: string;

  @Prop()
  about: string;

  @Prop()
  image: string;

  @Prop({ type: [{ type: String }] })
  options: string[];
}

export const TopicSchema = SchemaFactory.createForClass(Topic);

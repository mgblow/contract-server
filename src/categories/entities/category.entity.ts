import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {

  _id: Object;

  @Prop()
  parent: string;

  @Prop()
  name: string;

  @Prop()
  about: string;

  @Prop()
  image: string;

  @Prop({ type: [{ type: String }] })
  options: string[];
}

export const CategorySchema = SchemaFactory.createForClass(Category);

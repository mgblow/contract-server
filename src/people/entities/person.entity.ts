import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type PeopleDocument = People & Document;

@Schema({ timestamps: true })
export class People extends Document {
  // 🔹 Basic info
  @Prop({ required: true, unique: true })
  phone: string;

  @Prop({ type: String })
  email?: string;

  @Prop({ type: Boolean, default: true })
  firstLogin: boolean;

  // 🔹 Profile info
  @Prop({ type: String })
  username?: string;

  @Prop({ type: Number })
  age?: number;

  @Prop({ type: Number })
  weight?: number;

  @Prop({ type: String })
  bio?: string;

  // 🔹 Interests and hobbies
  @Prop({ type: [String], default: [] })
  hobbies?: string[];

  @Prop({ type: String })
  business?: string;

  @Prop({ type: String })
  customInterests?: string;

  // 🔹 Avatar config
  @Prop({
    type: {
      avatarStyle: { type: String },
      topType: { type: String },
      accessoriesType: { type: String },
      hairColor: { type: String },
      facialHairType: { type: String },
      facialHairColor: { type: String },
      clotheType: { type: String },
      clotheColor: { type: String },
      eyeType: { type: String },
      eyebrowType: { type: String },
      mouthType: { type: String },
      skinColor: { type: String },
    },
    default: {},
  })
  avatarConfig?: Record<string, string>;

  // 🔹 Timestamps (in ms)
  @Prop({ type: Number })
  createdAt?: number;

  @Prop({ type: Number })
  updatedAt?: number;
}

export const PeopleSchema = SchemaFactory.createForClass(People);

// Set timestamps manually in ms
PeopleSchema.pre<People>('save', function (next) {
  const now = Date.now();
  if (!this.createdAt) this.createdAt = now;
  this.updatedAt = now;
  next();
});

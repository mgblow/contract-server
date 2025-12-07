import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type GemWalletDocument = GemWallet & Document;

@Schema({
  timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
})
export class GemWallet {
  @Prop({ type: String, required: true, unique: true })
  userId: string;

  @Prop({ type: Number, default: 0 })
  balance: number;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const GemWalletSchema = SchemaFactory.createForClass(GemWallet);

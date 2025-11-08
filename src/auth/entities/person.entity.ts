import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Person extends Document {
    @Prop({ required: true, unique: true })
    phone: string;

    @Prop({ type: String })
    email?: string;

    @Prop({ type: Boolean, default: true })
    firstLogin: boolean;

    @Prop({ type: Number })
    createdAt?: number;

    @Prop({ type: Number })
    updatedAt?: number;
}

export const PersonSchema = SchemaFactory.createForClass(Person);

// Middleware to set createdAt and updatedAt as timestamps in milliseconds
PersonSchema.pre<Person>('save', function (next) {
    const now = Date.now();
    if (!this.createdAt) {
        this.createdAt = now;
    }
    this.updatedAt = now;
    next();
});

export class CreateLynkTexPayload {
  token: any;
  topic: string;
  text: string;
  // [lng, lat]
  location?: [number, number];
  gemdId?: string;
}

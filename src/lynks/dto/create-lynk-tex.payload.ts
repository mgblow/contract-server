export class CreateLynkTexPayload {
  token: any;
  lynkId: string;
  text: string;
  // [lng, lat]
  location?: [number, number];
  giftId?: string;
}

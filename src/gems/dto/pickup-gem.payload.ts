export class PickupGemPayload {
  token: any;

  spawnId: string;

  // user’s current location [lng, lat]
  location:
    | { type: "Point"; coordinates: [number, number] }
    | [number, number]
    | string;
}
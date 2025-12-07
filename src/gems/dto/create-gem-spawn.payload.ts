export class CreateGemSpawnPayload {
  token: any;

  definitionId: string;

  // center location
  location:
    | { type: "Point"; coordinates: [number, number] }
    | [number, number]
    | string;

  totalQuantity: number;
  pickupRadiusMeters?: number;

  startsAt?: Date;
  expiresAt?: Date;
}

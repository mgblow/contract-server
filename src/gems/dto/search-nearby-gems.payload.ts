export class SearchNearbyGemsPayload {
  token: any;

  // user position [lng, lat]
  location:
    | { type: "Point"; coordinates: [number, number] }
    | [number, number]
    | string;

  radiusMeters: number;
  limit?: number;
}
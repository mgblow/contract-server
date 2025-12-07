export class CreateTexPayload {
  token: any;

  // will be filled from token.userFields.id in service
  userId?: string;

  topicId?: string;

  text: string;

  /**
   * We accept either:
   * - GeoJSON-like { type: 'Point', coordinates: [lng, lat] }
   * - or a simple [lng, lat] tuple
   * - or a stringified JSON for backward compatibility
   */
  location?: {
    type: "Point";
    coordinates: [number, number];
  } | [number, number] | string;

  // TEX visibility
  isPublic?: boolean;

  // Gift / gems info
  giftId?: string;
  gemValue?: number;
}

export class GetUserStatusPayload {
  token: any;

  // If omitted, we check token.userFields.id (caller himself)
  userId?: string;
}

export class EmqxClientDisconnectedDto {
  clientId: string;
  username?: string;
  disconnected_at: number;
  reason: string;
}

export class EmqxMessagePublishDto {
  clientId: string;
  username?: string;
  topic: string;
  payload: string;
  qos: number;
  timestamp: number;
}

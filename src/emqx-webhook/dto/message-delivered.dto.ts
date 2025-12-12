export class EmqxMessageDeliveredDto {
  clientId: string;
  topic: string;
  payload: string;
  qos: number;
  timestamp: number;
}

export class EmqxSubscriptionDto {
  clientId: string;
  topic: string;
  qos: number;
  timestamp: number;
}

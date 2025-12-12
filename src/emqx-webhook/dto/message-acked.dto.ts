export class EmqxMessageAckedDto {
  clientId: string;
  topic: string;
  qos: number;
  timestamp: number;
}

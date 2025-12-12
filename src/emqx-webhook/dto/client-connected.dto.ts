export class EmqxClientConnectedDto {
  clientId: string;
  username?: string;
  ipaddress: string;
  timestamp: number;
  proto_ver: number;
  keepalive: number;
  clean_start: boolean;
}

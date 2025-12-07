export class BroadcastPayload {
  token: any;   // later you can enforce this to be admin/system

  // Event name for global/broadcast messages
  event: string;

  // Arbitrary payload
  data: any;

  // MQTT QoS
  qos?: 0 | 1 | 2;

  // Whether to retain this message on the broadcast topic (default false)
  retain?: boolean;
}

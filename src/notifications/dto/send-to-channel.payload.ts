export class SendToChannelPayload {
  token: any;

  // Logical per-session / per-client channel, usually token.userFields.channel
  channel: string;

  // Logical event name
  event: string;

  // Event payload
  data: any;

  // Optional QoS for MQTT publish (default 0)
  qos?: 0 | 1 | 2;
}

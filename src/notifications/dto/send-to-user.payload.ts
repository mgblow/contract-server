export class SendToUserPayload {
  // Auth token (same shape you already use everywhere: token.userFields...)
  token: any;

  // Target user that should receive this notification
  targetUserId: string;

  // Logical event name, e.g.:
  // "NEW_LYNK_TEX", "GIFT_RECEIVED", "LEVEL_UP", ...
  event: string;

  // Arbitrary event data (must be JSON-serializable)
  data: any;

  // Optional QoS for MQTT publish (default 0)
  qos?: 0 | 1 | 2;
}

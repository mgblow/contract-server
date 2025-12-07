export class SendLynkEventPayload {
  token: any;

  // Lynk (private world / chat) identifier
  lynkId: string;

  // Sender
  fromUserId: string;

  // Receiver (the other side of the lynk)
  toUserId: string;

  // Event name, e.g.:
  // "LYNK_TEX_CREATED", "LYNK_TEX_READ", "LYNK_TYPING", ...
  event: string;

  // Data specific to the event (lynkTex, readAt, typing = true, ...)
  data: any;

  // Optional QoS
  qos?: 0 | 1 | 2;
}

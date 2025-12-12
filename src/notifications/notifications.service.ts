import { Injectable, Logger } from "@nestjs/common";
import { EmqxClientService } from "./emqx-client.service";
import { SendToUserPayload } from "./dto/send-to-user.payload";
import { SendToChannelPayload } from "./dto/send-to-channel.payload";
import { SendLynkEventPayload } from "./dto/send-lynk-event.payload";
import { GetUserStatusPayload } from "./dto/get-user-status.payload";
import { BroadcastPayload } from "./dto/broadcast.payload";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly emqx: EmqxClientService) {}

  // Topic conventions (centralized so you can tweak later)
  private userEventsTopic(userId: string): string {
    return `user/${userId}/events`;
  }

  private channelEventsTopic(channel: string): string {
    return `${channel}/events`;
  }


  // ───────────────────── Push helpers ─────────────────────

  /**
   * Send a low-level event to a generic logical "channel" (your reply channel).
   * Frontend should subscribe to `${channel}/events`.
   */
  async sendToChannel(payload: SendToChannelPayload): Promise<void> {
    const topic = this.channelEventsTopic(payload.channel);
    const msg = {
      event: payload.event,
      data: payload.data,
      ts: Date.now(),
    };

    await this.emqx.publish(topic, msg, payload.qos ?? 0, false);
  }

  /**
   * Send an event to a user (all clients subscribed to user/{userId}/events).
   * This doesn't care how many MQTT clients the user has.
   */
  async sendToUser(payload: SendToUserPayload): Promise<void> {
    const topic = this.userEventsTopic(payload.targetUserId);
    const msg = {
      event: payload.event,
      data: payload.data,
      fromUserId: payload.token?.userFields?.id ?? null,
      ts: Date.now(),
    };

    await this.emqx.publish(topic, msg, payload.qos ?? 0, false);
  }


  async handleClientConnected(data: any) {
    this.logger.log(`User connected: ${data.clientId}`);

    // You can mark the user online or update DB
    await this.emqx.saveUserPresence(data.clientId, true);

    // Optional: notify user devices
    await this.emqx.publish(
      this.userEventsTopic(data.userId),
      { event: "USER_ONLINE", userId: data.userId, ts: Date.now() },
      0,
      false
    );
  }

  async handleClientDisconnected(data: any) {
    this.logger.log(
      `User disconnected: ${data.clientId} reason=${data.reason}`
    );

    await this.emqx.saveUserPresence(data.clientId, false);

    await this.emqx.publish(
      this.userEventsTopic(data.userId),
      { event: "USER_OFFLINE", userId: data.userId, ts: Date.now() },
      0,
      false
    );
  }

  // ─────────────────────────── TEX message handling ───────────────────────────

  async handleMessagePublished(data: any) {
    this.logger.log(`Message published => topic=${data.topic}`);

    const msg = {
      event: "TEX_RECEIVED",
      topic: data.topic,
      payload: data.payload,
      clientId: data.clientId,
      ts: Date.now(),
    };

    // Forward published message to appropriate frontend subscriber
    await this.emqx.publish(data.topic, msg, 0, false);

    // Optionally: store in DB if public or private TEX
    // You can parse topic for:
    // - lynku/public
    // - lynku/person/{id}
    // - lynku/person/{id}/private/{fromUserId}
  }

  // ─────────────────────────── Subscription events ───────────────────────────

  async handleSubscription(data: any) {
    this.logger.debug(`Subscription event: ${data.clientId} -> ${data.topic}`);

    await this.emqx.publish(
      this.userEventsTopic(data.userId),
      {
        event: "SUBSCRIBED",
        topic: data.topic,
        ts: Date.now(),
      },
      0,
      false
    );
  }

  // ─────────────────────────── Existing Service API ───────────────────────────

  async getUserStatus(payload: GetUserStatusPayload) {
    const userId = payload.userId || payload.token.userFields.id;
    const { isOnline, sessions } = await this.emqx.isUserOnline(userId);

    return { userId, isOnline, sessions };
  }


  async sendLynkEvent(payload: SendLynkEventPayload): Promise<void> {
    const { lynkId, fromUserId, toUserId, event, data } = payload;
    const send = {
      lynkId,
      fromUserId,
      toUserId,
      event,
      data,
      ts: Date.now(),
    };

    await this.emqx.publish(this.userEventsTopic(fromUserId), send, 0, false);
    if (toUserId && toUserId !== fromUserId) {
      await this.emqx.publish(this.userEventsTopic(toUserId), send, 0, false);
    }
  }

  async broadcast(payload: BroadcastPayload): Promise<void> {
    const topic = "broadcast/events";
    const msg = {
      event: payload.event,
      data: payload.data,
      ts: Date.now(),
    };
    await this.emqx.publish(topic, msg, payload.qos ?? 0, payload.retain ?? false);
  }
}

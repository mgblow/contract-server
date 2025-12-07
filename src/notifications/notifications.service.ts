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

  private lynkTopic(lynkId: string, userId: string): string {
    // private 2-way topic per lynk & user
    // each side subscribes to lynk/{lynkId}/{userId}
    return `lynk/${lynkId}/${userId}`;
  }

  // ───────────────────── Presence ─────────────────────

  async getUserStatus(payload: GetUserStatusPayload) {
    const userId = payload.userId || payload.token.userFields.id;
    const { isOnline, sessions } = await this.emqx.isUserOnline(userId);

    return {
      userId,
      isOnline,
      sessions,
    };
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

  /**
   * 2-way private lynk event.
   *
   * You have two choices:
   *  - A) Use user topics (user/{id}/events) with event.type "LYNK_*"
   *  - B) Use dedicated lynk/{lynkId}/{userId} topics.
   *
   * Below I'll do A) (simpler) but keep topic helpers if you want B) later.
   */
  async sendLynkEvent(payload: SendLynkEventPayload): Promise<void> {
    const { lynkId, fromUserId, toUserId, event, data } = payload;

    const eventPayload = {
      lynkId,
      fromUserId,
      toUserId,
      event,
      data,
      ts: Date.now(),
    };

    // 1) send to sender (so multiple devices see the same)
    const fromTopic = this.userEventsTopic(fromUserId);
    await this.emqx.publish(fromTopic, eventPayload, payload.qos ?? 0, false);

    // 2) send to receiver
    if (toUserId && toUserId !== fromUserId) {
      const toTopic = this.userEventsTopic(toUserId);
      await this.emqx.publish(toTopic, eventPayload, payload.qos ?? 0, false);
    }
  }

  /**
   * Broadcast: send event to a global topic (for global announcements, maintenance, etc.)
   * Clients subscribe optionally to "broadcast/events".
   */
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

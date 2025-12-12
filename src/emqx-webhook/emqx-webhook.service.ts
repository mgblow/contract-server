import { Injectable, Logger } from '@nestjs/common';
import { RequestService } from '../injection/request.service';
import { EmqxWebhookBaseDto } from './dto/base.dto';
import { EmqxClientConnectedDto } from './dto/client-connected.dto';
import { EmqxClientDisconnectedDto } from './dto/client-disconnected.dto';
import { EmqxMessagePublishDto } from './dto/message-publish.dto';
import { EmqxMessageDeliveredDto } from './dto/message-delivered.dto';
import { EmqxMessageAckedDto } from './dto/message-acked.dto';
import { EmqxSubscriptionDto } from './dto/subscription.dto';

@Injectable()
export class EmqxWebhookService {
  private readonly logger = new Logger(EmqxWebhookService.name);

  constructor(private readonly request: RequestService) {}

  async handleEvent(payload: EmqxWebhookBaseDto) {
    const { event, data } = payload;
    this.logger.debug(`EMQX Event Received: ${event}`);

    switch (event) {
      case 'client.connected':
        return this.onClientConnected(data as EmqxClientConnectedDto);

      case 'client.disconnected':
        return this.onClientDisconnected(data as EmqxClientDisconnectedDto);

      case 'message.publish':
        return this.onMessagePublish(data as EmqxMessagePublishDto);

      case 'message.delivered':
        return this.onMessageDelivered(data as EmqxMessageDeliveredDto);

      case 'message.acked':
        return this.onMessageAcked(data as EmqxMessageAckedDto);

      case 'session.subscribed':
        return this.onSubscribed(data as EmqxSubscriptionDto);

      default:
        return this.onUnknown(payload);
    }
  }

  private async onClientConnected(data: EmqxClientConnectedDto) {
    this.logger.log(`Client connected: ${data.clientId}`);

    await this.request.send('notification_event', {
      event: 'client.connected',
      clientId: data.clientId,
      username: data.username ?? null,
      ip: data.ipaddress,
      timestamp: data.timestamp,
    });
  }

  private async onClientDisconnected(data: EmqxClientDisconnectedDto) {
    this.logger.log(`Client disconnected: ${data.clientId}, reason=${data.reason}`);

    await this.request.send('notification_event', {
      event: 'client.disconnected',
      clientId: data.clientId,
      reason: data.reason,
      disconnectedAt: data.disconnected_at,
    });
  }

  private async onMessagePublish(data: EmqxMessagePublishDto) {
    this.logger.log(`Message published to ${data.topic}`);

    await this.request.send('notification_event', {
      event: 'message.publish',
      topic: data.topic,
      clientId: data.clientId,
      payload: data.payload,
      qos: data.qos,
      timestamp: data.timestamp,
    });
  }

  private async onMessageDelivered(data: EmqxMessageDeliveredDto) {
    await this.request.send('notification_event', {
      event: 'message.delivered',
      clientId: data.clientId,
      topic: data.topic,
      qos: data.qos,
      timestamp: data.timestamp,
    });
  }

  private async onMessageAcked(data: EmqxMessageAckedDto) {
    await this.request.send('notification_event', {
      event: 'message.acked',
      clientId: data.clientId,
      topic: data.topic,
      qos: data.qos,
      timestamp: data.timestamp,
    });
  }

  private async onSubscribed(data: EmqxSubscriptionDto) {
    await this.request.send('notification_event', {
      event: 'session.subscribed',
      clientId: data.clientId,
      topic: data.topic,
      qos: data.qos,
      timestamp: data.timestamp,
    });
  }

  private async onUnknown(payload: EmqxWebhookBaseDto) {
    this.logger.warn(`Unknown EMQX webhook event: ${payload.event}`);

    await this.request.send('notification_event', {
      event: 'unknown',
      raw: payload,
    });
  }
}

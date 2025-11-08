import { Injectable, Logger } from "@nestjs/common";
import { MqttOptions, ClientProxyFactory, Transport } from "@nestjs/microservices";

@Injectable()
export class ResponseService {
  private readonly logger = new Logger(ResponseService.name);
  private client: any;

  constructor() {
    const mqttUrl = process.env["MQTT_URL"];
    const username = process.env["MQTT_USERNAME"];
    const password = process.env["MQTT_PASSWORD"];
    const clientId = `lynku-${Math.random().toString(16).slice(2, 8)}`;

    const options: MqttOptions = {
      transport: Transport.MQTT,
      options: {
        url: mqttUrl,
        username,
        password,
        clientId,
        clean: true,
        reconnectPeriod: 2000
      }
    };

    this.client = ClientProxyFactory.create(options);
    this.logger.log(`[MQTT] Connecting to broker as clientId: ${clientId}`);
  }

  public async sendSuccess(channel: string, data: any): Promise<void> {
    try {
      await this.client.emit(channel, {
        success: true,
        body: data
      }).toPromise();
      this.logger.log(`[MQTT] Success message sent to ${channel}`);
    } catch (err) {
      this.logger.error(`[MQTT] Failed to send success message to ${channel}`, err);
    }
  }

  public async sendError(channel: string, errors: any): Promise<void> {
    try {
      await this.client.emit(channel, {
        success: false,
        errors
      }).toPromise();
      this.logger.warn(`[MQTT] Error message sent to ${channel}: ${JSON.stringify(errors)}`);
    } catch (err) {
      this.logger.error(`[MQTT] Failed to send error message to ${channel}`, err);
    }
  }

  public async subscribe(topic: string, callback: (message: any) => void): Promise<void> {
    await this.client.subscribe(topic).toPromise();
    this.client.on("message", (t: string, message: Buffer) => {
      if (t === topic) {
        callback(message);
      }
    });
    this.logger.log(`[MQTT] Subscribed to topic: ${topic}`);
  }
}

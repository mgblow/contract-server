import { Injectable } from "@nestjs/common";
import * as mqtt from "mqtt";

@Injectable()
export class RequestService {
  private client: mqtt.MqttClient;

  constructor() {
    const mqttUrl = process.env["MQTT_URL"];
    const username = process.env["MQTT_USERNAME"];
    const password = process.env["MQTT_PASSWORD"];

    // Generate random clientId with "lynku-" prefix
    const clientId = `lynku-${Math.random().toString(16).slice(2, 8)}`;

    const options: mqtt.IClientOptions = {
      clientId,
      username,
      password,
      clean: true,           // start a new session
      reconnectPeriod: 2000, // auto reconnect every 2 seconds
    };

    this.client = mqtt.connect(mqttUrl, options);

    this.client.on("connect", () => {
      console.log(`[MQTT] Connected to broker as ${clientId}`);
    });

    this.client.on("error", (err) => {
      console.error(`[MQTT] Error connecting: ${err.message}`);
    });

    this.client.on("reconnect", () => {
      console.log("[MQTT] Reconnecting...");
    });

    this.client.on("close", () => {
      console.log("[MQTT] Connection closed");
    });
  }

  public async send(channel: string, data: any): Promise<any> {
    const responsePromise = this.subscribeOnce(
      data.token.userFields.channel + "/" + channel
    );
    await this.publish(channel, data);
    const response = await responsePromise;
    return response.toString();
  }

  private async subscribeOnce(topic: string): Promise<Buffer> {
    return new Promise<Buffer>((resolve) => {
      this.client.subscribe(topic);
      const messageHandler = (receivedTopic: string, message: Buffer) => {
        if (receivedTopic === topic) {
          this.client.removeListener("message", messageHandler); // unsubscribe handler after first message
          resolve(message);
        }
      };
      this.client.on("message", messageHandler);
    });
  }

  public async publish(topic: string, data: any): Promise<void> {
    const payload = JSON.stringify(data);
    this.client.publish(topic, payload);
  }
}

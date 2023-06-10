import { Injectable } from "@nestjs/common";
import * as mqtt from "mqtt";

@Injectable()
export class RequestService {
  private client: mqtt.MqttClient;

  constructor() {
    const mqttUrl = process.env["MQTT_URL"];
    this.client = mqtt.connect(mqttUrl);
    this.client.on("connect", () => {
      console.log("Connected to MQTT broker");
    });
  }

  public async send(channel: string, data: any): Promise<any> {
    const responsePromise = this.subscribeOnce(data.token.userFields.channel + "/" + channel);
    await this.publish(channel, data);
    const response = await responsePromise;
    return response.toString();
  }


  private async subscribeOnce(topic: string): Promise<Buffer> {
    return new Promise<Buffer>((resolve) => {
      this.client.subscribe(topic);
      this.client.on("message", (receivedTopic: string, message: Buffer) => {
        if (receivedTopic === topic) {
          resolve(message);
        }
      });
    });
  }

  public async publish(topic: string, data: any): Promise<void> {
    const payload = JSON.stringify(data);
    this.client.publish(topic, payload);
  }
}

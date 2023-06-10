import { Injectable } from "@nestjs/common";
import { MqttOptions, ClientProxyFactory, Transport } from "@nestjs/microservices";

@Injectable()
export class ResponseService {
  private client: any;

  constructor() {
    const options: MqttOptions = {
      transport: Transport.MQTT,
      options: {
        url: process.env["MQTT_URL"]
      }
    };
    this.client = ClientProxyFactory.create(options);
  }

  public async sendSuccess(channel: string, data: any): Promise<void> {
    await this.client.emit(channel, {
      success: true,
      body: data
    }).toPromise();
  }

  public async sendError(channel: string, errors: any): Promise<void> {
    await this.client.emit(channel, {
      success: false,
      errors: errors
    }).toPromise();
  }

  public async subscribe(topic: string, callback: (message: any) => void): Promise<void> {
    await this.client.subscribe(topic).toPromise();
    this.client
      .on("message", (topic: string, message: Buffer) => {
        callback(message);
      });
  }
}

import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { HttpModule } from "./http.module";
import { MqttModule } from "./mqtt.module";
import { ExpressAdapter } from "@nestjs/platform-express";
import * as express from "express";

async function bootstrap() {
  const httpApp = await NestFactory.create(
    HttpModule,
    new ExpressAdapter(express())
  );
  httpApp.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
  });
  await httpApp.listen(3000);
  const microserviceApp = await NestFactory.createMicroservice<MicroserviceOptions>(
    MqttModule,
    {
      transport: Transport.MQTT,
      options: {
        url: process.env["MQTT_URL"],
        clientId:generateRandomClientId("lynku"), 
        username: process.env["MQTT_USERNAME"],
        password: process.env["MQTT_PASSWORD"]
      }
    }
  );
  // add a global listener to intercept and validate tokens
  await microserviceApp.listen();
}

function generateRandomClientId(prefix: string = "lynku") {
  // Generate 6 random hex characters
  const randomHex = Math.random().toString(16).slice(2, 8);
  return `${prefix}-${randomHex}`;
}

bootstrap();

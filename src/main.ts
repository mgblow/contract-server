import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { HttpModule } from "./http.module";
import { MqttModule } from "./mqtt.module";

async function bootstrap() {
  const httpApp = await NestFactory.create(HttpModule);
  await httpApp.listen(3000);
  const microserviceApp = await NestFactory.createMicroservice<MicroserviceOptions>(
    MqttModule,
    {
      transport: Transport.MQTT,
      options: {
        url: process.env["MQTT_URL"]
      }
    }
  );
  // add a global listener to intercept and validate tokens
  await microserviceApp.listen();
}

bootstrap();

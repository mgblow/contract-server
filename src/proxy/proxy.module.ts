import { Module } from "@nestjs/common";
import { ProxyService } from "./proxy.service";
import { ProxyController } from "./proxy.controller";
import { RequestService } from "../injection/request.service";
import { AesService } from "../injection/aes.service";

@Module({
  controllers: [ProxyController],
  providers: [ProxyService, RequestService, AesService]
})
export class ProxyModule {
}

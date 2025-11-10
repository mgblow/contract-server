import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { AesService } from "../injection/aes.service";
import { RedisClientModule } from "../injection/redis-client.module";
import { RequestService } from "../injection/request.service";

@Module({
  imports: [RedisClientModule],
  controllers: [AuthController],
  providers: [AuthService, AesService, RequestService]
})
export class AuthModule {
}

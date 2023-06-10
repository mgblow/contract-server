import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { AesService } from "../injection/aes.service";
import { RedisClientModule } from "../injection/redis-client.module";

@Module({
  imports: [RedisClientModule],
  controllers: [AuthController],
  providers: [AuthService, AesService]
})
export class AuthModule {
}

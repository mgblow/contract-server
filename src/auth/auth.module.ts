import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { AesService } from "../injection/aes.service";
import { RedisClientModule } from "../injection/redis-client.module";
import { PersonModule } from "./person.module";

@Module({
  imports: [RedisClientModule, PersonModule],
  controllers: [AuthController],
  providers: [AuthService, AesService]
})
export class AuthModule {
}

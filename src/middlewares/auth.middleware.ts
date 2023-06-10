import { CanActivate, ExecutionContext, Inject, Injectable, NotAcceptableException } from "@nestjs/common";
import { config } from "dotenv";
import { AesService } from "../injection/aes.service";

@Injectable()
export class AuthMiddleware implements CanActivate {
  private TOKEN_SECRET: string;

  constructor(
    private readonly aesService: AesService,
    @Inject("REDIS_CLIENT") private readonly redisClient: any
  ) {
    config();
    this.TOKEN_SECRET = process.env["TOKEN_SECRET"];
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // validate token
    try {
      const token = await this.aesService.decrypt(request.token);
      request.token = JSON.parse(token);
      const secret = await this.aesService.decrypt(request.token.secret);
      if (this.TOKEN_SECRET != secret) {
        return false;
      }
      // check the expiry time
      // if (request.token.expiresAt < new Date().getTime()) {
      //   throw new NotAcceptableException(`token has expired on this request!`);
      // }
      return true;
    } catch (e) {
      throw new NotAcceptableException(`token validation fails on this request!`);
    }
  }
}

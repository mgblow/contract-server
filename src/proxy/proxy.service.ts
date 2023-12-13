import { Injectable, NotAcceptableException } from "@nestjs/common";
import { PublishProxyDto } from "./dto/publish-proxy.dto";
import { RequestService } from "../injection/request.service";
import { AesService } from "../injection/aes.service";

@Injectable()
export class ProxyService {
  private TOKEN_SECRET: string;

  constructor(
    private readonly aesService: AesService,
    private readonly requestService: RequestService
  ) {
    this.TOKEN_SECRET = process.env["TOKEN_SECRET"];
  }

  async publish(publishProxyDto: PublishProxyDto, token: string): Promise<any> {
    // validate token
    try {
      token = await this.aesService.decrypt(token);
      publishProxyDto.data.token = JSON.parse(token);
      const secret = await this.aesService.decrypt(publishProxyDto.data.token.secret);
      if (this.TOKEN_SECRET != secret) {
        return false;
      }
      // check the expiry time
      // if (publishProxyDto.token.expiresAt < new Date().getTime()) {
      //   throw new NotAcceptableException(`token has expired on this request!`);
      // }
      return await this.requestService.send(publishProxyDto.topic, publishProxyDto.data);
    } catch (e) {
      throw new NotAcceptableException(`token validation fails on this request!`);
    }
  }
}

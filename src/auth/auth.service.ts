import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { SignupDto } from "./dto/signup.dto";
import { User } from "./entities/user.entity";
import { VerifyDto } from "./dto/verify.dto";
import { AesService } from "../injection/aes.service";
import { config } from "dotenv";


@Injectable()
export class AuthService {

  private readonly redisSearchIndex: string = "users";
  private readonly TOKEN_SECRET: string;
  private readonly TOKEN_EXPIRY: number;

  constructor(
    private readonly aesService: AesService,
    @Inject("REDIS_CLIENT") private readonly redisClient: any
  ) {
    config();
    this.TOKEN_SECRET = process.env["TOKEN_SECRET"];
    this.TOKEN_EXPIRY = parseInt(process.env["TOKEN_EXPIRY"]);
  }

  async entry(signupDto: SignupDto) {
    const userFields = await this.redisClient.hgetall(`users:${signupDto.phone}`);
    var user = null;
    if (Object.keys(userFields).length === 0) {
      // new to platform
      const user = new User(signupDto.phone);
      await this.redisClient.send_command(
        "HSET",
        [`users:${user.id}`, ...Object.entries(user).flat()]
      );
    }

    // generate 2-step verification code
    const verify = {
      uId: signupDto.phone,
      //Math.floor(Math.random() * 100000)
      code: "000"
    };

    const key = `verifications:${signupDto.phone}`;
    const entries = Object.entries(verify).flat();

    await this.redisClient.send_command("HSET", [key, ...entries]);
    await this.redisClient.send_command("EXPIRE", [key, 120]); // 120 seconds = 2 minutes
    return {
      success: true
    };
  }

  async verify(verifyDto: VerifyDto) {
    const verificationFields = await this.redisClient.hgetall(`verifications:${verifyDto.phone}`);
    if (Object.keys(verificationFields).length === 0) {
      throw new NotFoundException(`Verification try with phone ${verifyDto.phone} not found`);
    }
    if (verificationFields.code != verifyDto.code) {
      throw new NotFoundException(`Verification try failed for phone ${verifyDto.phone} not found`);
    }
    // fetch user's data
    const userFields = await this.redisClient.hgetall(`users:${verifyDto.phone}`);

    if (Object.keys(userFields).length === 0) {
      throw new NotFoundException(`Verified but user with phone ${verifyDto.phone} not found`);
    }
    const secret = await this.aesService.encrypt(this.TOKEN_SECRET);
    userFields.channel = uuidv4();
    const data = {
      secret: secret,
      userFields: userFields,
      expiresAt: (new Date().getTime()) + this.TOKEN_EXPIRY
    };
    const token = await this.aesService.encrypt(JSON.stringify(data));
    return {
      success: true,
      channel: userFields.channel,
      token: token
    };
  }

  async refresh() {
  }
}

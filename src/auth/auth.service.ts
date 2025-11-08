import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { SignupDto } from "./dto/signup.dto";
import { VerifyDto } from "./dto/verify.dto";
import { AesService } from "../injection/aes.service";
import { config } from "dotenv";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Person } from "./entities/person.entity";

@Injectable()
export class AuthService {

  private readonly TOKEN_SECRET: string;
  private readonly TOKEN_EXPIRY: number;

  constructor(
    private readonly aesService: AesService,
    @Inject("REDIS_CLIENT") private readonly redisClient: any,
    @InjectModel(Person.name) private readonly personModel: Model<Person>
  ) {
    config();
    this.TOKEN_SECRET = process.env["TOKEN_SECRET"];
    this.TOKEN_EXPIRY = parseInt(process.env["TOKEN_EXPIRY"]);
  }

  async entry(signupDto: SignupDto) {
    //  Check if person exists in MongoDB
    let person = await this.personModel.findOne({ phone: signupDto.phone });
    if (!person) {
      person = new this.personModel({ phone: signupDto.phone });
      await person.save();
    }

    // Check if user exists in Redis
    const redisKey = `users:${person._id.toString()}`;
    const userFields = await this.redisClient.hgetall(redisKey);

    if (Object.keys(userFields).length === 0) {
      // Map MongoDB person fields to Redis
      const userData = {
        id: person._id.toString(),
        phone: person.phone,
        firstLogin: person.firstLogin.toString(), // Redis stores strings
        email: person.email || ""
      };

      await this.redisClient.send_command(
        "HSET",
        [redisKey, ...Object.entries(userData).flat()]
      );
    }

    // Generate 2-step verification code
    const verify = {
      uId: person._id.toString(),
      code: "000" // replace with real random code in production
    };
    const verifyKey = `verifications:${signupDto.phone}`;
    await this.redisClient.send_command(
      "HSET",
      [verifyKey, ...Object.entries(verify).flat()]
    );
    await this.redisClient.send_command("EXPIRE", [verifyKey, 120]); // 2 min

    return { success: true };
  }

  async verify(verifyDto: VerifyDto) {
    const verificationKey = `verifications:${verifyDto.phone}`;
    const verificationFields = await this.redisClient.hgetall(verificationKey);

    if (Object.keys(verificationFields).length === 0) {
      throw new NotFoundException(`Verification for phone ${verifyDto.phone} not found`);
    }
    if (verificationFields.code !== verifyDto.code) {
      throw new NotFoundException(`Invalid verification code for phone ${verifyDto.phone}`);
    }
    
    // Fetch user's Redis data
    const redisKey = `users:${verificationFields.uId}`;
    const userFields = await this.redisClient.hgetall(redisKey);
    if (Object.keys(userFields).length === 0) {
      throw new NotFoundException(`User data for phone ${verifyDto.phone} not found`);
    }

    // Generate token
    const secret = await this.aesService.encrypt(this.TOKEN_SECRET);
    userFields.channel = userFields.id;
    const data = {
      secret,
      userFields,
      expiresAt: Date.now() + this.TOKEN_EXPIRY
    };
    const token = await this.aesService.encrypt(JSON.stringify(data));

    // // Optional: mark firstLogin false in MongoDB
    // await this.personModel.updateOne(
    //   { phone: verifyDto.phone },
    //   { firstLogin: false, updatedAt: Date.now() }
    // );

    return {
      success: true,
      channel: userFields.channel,
      token
    };
  }

  async refresh() {
    // implement refresh logic here
  }
}

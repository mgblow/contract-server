import { Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { SignupDto } from "./dto/signup.dto";
import { VerifyDto } from "./dto/verify.dto";
import { AesService } from "../injection/aes.service";
import { config } from "dotenv";
import { RequestService } from "../injection/request.service";

@Injectable()
export class AuthService {
  private readonly TOKEN_SECRET: string;
  private readonly TOKEN_EXPIRY: number;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly aesService: AesService,
    private readonly requestService: RequestService,
    @Inject("REDIS_CLIENT") private readonly redisClient: any,
  ) {
    config();
    this.TOKEN_SECRET = process.env["TOKEN_SECRET"];
    this.TOKEN_EXPIRY = parseInt(process.env["TOKEN_EXPIRY"]);
  }

  async entry(signupDto: SignupDto) {
    const start = Date.now();
    const phone = signupDto.phone;
    const channelId = uuidv4();

    this.logger.log(`[ENTRY] Start signup for phone: ${phone}`);

    try {
      // Check person with People service
      const token = { userFields: { channel: channelId } };
      const personData = JSON.parse(
        await this.requestService.send("createPerson", {
          token,
          phone
        })
      );

      if (!personData.data.success) {
        this.logger.error(
          `[ENTRY] People service returned failure for phone: ${phone}`
        );
        throw new InternalServerErrorException(
          "[auth] Error during connectivity with People service"
        );
      }

      const person = personData.data.body;
      this.logger.debug(
        `[ENTRY] Retrieved person (id=${person._id}) for phone: ${phone}`
      );

      // Check if user exists in Redis
      const redisKey = `users:${person._id.toString()}`;
      const userFields = await this.redisClient.hgetall(redisKey);

      if (Object.keys(userFields).length === 0) {
        this.logger.log(`[ENTRY] New Redis user record for ${phone}`);

        const userData = {
          id: person._id.toString(),
          phone: person.phone,
          firstLogin: person.firstLogin,
          email: person.email || ""
        };

        await this.redisClient.send_command(
          "HSET",
          [redisKey, ...Object.entries(userData).flat()]
        );

        this.logger.debug(`[ENTRY] Redis record created for ${phone}`);
      } else {
        this.logger.debug(`[ENTRY] Existing Redis record found for ${phone}`);
      }

      // Generate verification code
      const verify = {
        uId: person._id.toString(),
        code: "000" // Replace with random in production
      };
      const verifyKey = `verifications:${phone}`;
      await this.redisClient.send_command(
        "HSET",
        [verifyKey, ...Object.entries(verify).flat()]
      );
      await this.redisClient.send_command("EXPIRE", [verifyKey, 120]); // 2 min

      this.logger.log(
        `[ENTRY] Verification code generated for ${phone}, expires in 120s`
      );

      this.logger.log(
        `[ENTRY] Signup completed for ${phone} in ${Date.now() - start}ms`
      );

      return { success: true };
    } catch (error) {
      this.logger.error(
        `[ENTRY] Failed signup for ${phone}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async verify(verifyDto: VerifyDto) {
    const phone = verifyDto.phone;
    const start = Date.now();

    this.logger.log(`[VERIFY] Start verification for phone: ${phone}`);

    try {
      const verificationKey = `verifications:${phone}`;
      const verificationFields = await this.redisClient.hgetall(verificationKey);

      if (Object.keys(verificationFields).length === 0) {
        this.logger.warn(`[VERIFY] No verification record found for ${phone}`);
        throw new NotFoundException(`Verification for phone ${phone} not found`);
      }

      if (verificationFields.code !== verifyDto.code) {
        this.logger.warn(`[VERIFY] Invalid verification code for ${phone}`);
        throw new NotFoundException(`Invalid verification code for phone ${phone}`);
      }

      const redisKey = `users:${verificationFields.uId}`;
      const userFields = await this.redisClient.hgetall(redisKey);

      if (Object.keys(userFields).length === 0) {
        this.logger.error(`[VERIFY] No Redis user found for ${phone}`);
        throw new NotFoundException(`User data for phone ${phone} not found`);
      }

      this.logger.debug(`[VERIFY] Redis user data found for ${phone}`);

      // Generate token
      const secret = await this.aesService.encrypt(this.TOKEN_SECRET);
      userFields.channel = userFields.id;
      const data = {
        secret,
        userFields,
        expiresAt: Date.now() + this.TOKEN_EXPIRY
      };
      const token = await this.aesService.encrypt(JSON.stringify(data));

      this.logger.log(`[VERIFY] Token generated for ${phone}`);

      this.logger.log(
        `[VERIFY] Verification completed for ${phone} in ${Date.now() - start}ms`
      );

      // call EMQX api to create mqtt client for this user
      const brokerCredentials = await this.createEmqxUser(userFields.id, token);
      return {
        success: true,
        _id: userFields.id,
        firstLogin: userFields.firstLogin,
        channel: userFields.channel,
        brokerCredentials: brokerCredentials,
        token
      };
    } catch (error) {
      this.logger.error(
        `[VERIFY] Verification failed for ${phone}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async createEmqxUser(userId: string, password: string) {
    const url = process.env.EMQX_APP_URL + "/authentication/password_based:built_in_database/users";

    const createUserResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization":
          "Basic " + Buffer.from(`${process.env.EMQX_APP_KEY}:${process.env.EMQX_APP_SECRET}`).toString("base64"),      },
      body: JSON.stringify({
        user_id: userId,
        password: password,
        is_superuser: false,
      }),
    });

    if(createUserResponse.ok) {
      const data = await createUserResponse.json();
      console.log("User created:", data);
      return data;
    }

    if (!createUserResponse.ok) {
      const createUserResponseError = await createUserResponse.json();
      if(createUserResponseError.code === 'ALREADY_EXISTS') {
        const url = process.env.EMQX_APP_URL + "/authentication/password_based:built_in_database/users/" + userId;
        const updateUserResponse = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization":
              "Basic " + Buffer.from(`${process.env.EMQX_APP_KEY}:${process.env.EMQX_APP_SECRET}`).toString("base64"),      },
          body: JSON.stringify({
            password: password,
          }),
        });
        if(updateUserResponse.ok) {
          const updatedData = await updateUserResponse.json();
          this.logger.log("User updated:", updatedData);
          return updatedData;
        }
        const updateUserResponseError = await createUserResponseError.json();
        this.logger.error("Error while creating new user:", updateUserResponseError);
        return null;
      }else{
        console.error("Error creating user:", createUserResponseError);
        return null;
      }
    }
  }

  async refresh() {
    this.logger.warn("[REFRESH] Token refresh endpoint not implemented yet");
    // implement refresh logic here
  }
}

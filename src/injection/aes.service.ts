import { Injectable, Scope } from "@nestjs/common";
import * as crypto from "crypto";
import { config } from "dotenv";

@Injectable({ scope: Scope.DEFAULT })
export class AesService {
  private readonly algorithm = "aes-256-ctr";
  private readonly key = Buffer.alloc(32);
  private readonly iv = Buffer.alloc(16);
  private readonly SECRET_KEY : string;
  private readonly SECRET_IV : string;

  constructor() {
    config();
    this.key.write(process.env["SECRET_KEY"]);
    this.iv.write(process.env["SECRET_IV"]);
  }

  async encrypt(text: string): Promise<string> {
    const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
  }

  async decrypt(encryptedText: string): Promise<string> {
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }
}

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { File } from "./entities/file.entity";
import * as sharp from "sharp";
import { AesService } from "../injection/aes.service";

@Injectable()
export class FilesService {
  private readonly TOKEN_SECRET: string;

  constructor(
    @InjectModel(File.name) private fileModel: Model<File>,
    private readonly aesService: AesService
  ) {
    this.TOKEN_SECRET = process.env["TOKEN_SECRET"];
  }


  async save(file: Express.Multer.File) {
    // const token = await this.aesService.decrypt(publishProxyDto.data.token);
    // publishProxyDto.data.token = JSON.parse(token);
    // const secret = await this.aesService.decrypt(publishProxyDto.data.token.secret);
    // if (this.TOKEN_SECRET != secret) {
    //   return false;
    // }
    const resizedImageBuffer = await sharp(file.path)
      .resize(800, 600)
      .toBuffer();
    return file;
  }

}

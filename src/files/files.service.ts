import { Injectable, StreamableFile } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { File } from "./entities/file.entity";
import { join } from "path";
import { createReadStream } from "fs";
import * as sharp from "sharp";

@Injectable()
export class FilesService {
  constructor(
    @InjectModel(File.name) private fileModel: Model<File>
  ) {
  }


  async save(file: Express.Multer.File) {
    const resizedImageBuffer = await sharp(file.path)
      .resize(800, 600)
      .toBuffer();
    return file;
  }

}

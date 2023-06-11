import {
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator, NotFoundException,
  Param,
  ParseFilePipe,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors
} from "@nestjs/common";
import { createReadStream } from "fs";
import { join } from "path";
import { FileInterceptor } from "@nestjs/platform-express";
import { FilesService } from "./files.service";
import { Response } from 'express';

@Controller("files")
export class FilesController {
  constructor(private readonly filesService: FilesService) {
  }


  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  uploadFile(@UploadedFile(
    new ParseFilePipe({
      validators: [
        new FileTypeValidator({ fileType: ".(png|jpeg|jpg)" }),
        new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 4 })
      ]
    })
  ) file: Express.Multer.File) {
    return this.filesService.save(file);
  }


  @Get("/:fileName")
  getFile(@Param("fileName") fileName: string, @Res() res: Response) {
    try {
      const filePath = join(process.cwd(), "uploads", fileName);
      res.sendFile(filePath);
    }catch (e) {
      throw new NotFoundException('Resource not found');
    }
  }


}

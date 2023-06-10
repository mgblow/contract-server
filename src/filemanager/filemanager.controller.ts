import {
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
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

@Controller("filemanager")
export class FilemanagerController {
  constructor() {
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
    return file;
  }


  @Get("/file/:filename")
  getFile(@Param("filename") filename: string, @Res() res: Response): StreamableFile {
    const filePath = join(process.cwd(), "uploads" , filename);
    const file = createReadStream(join(filePath));
    return new StreamableFile(file);
  }


}

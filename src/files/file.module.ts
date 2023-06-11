import { Module } from "@nestjs/common";
import { FilesController } from "./files.controller";
import { MulterModule } from "@nestjs/platform-express";
import { DatabaseConnectionModule } from "../injection/DatabaseConnection";
import { MongooseModule } from "@nestjs/mongoose";
import { File, FileSchema } from "./entities/file.entity";
import { FilesService } from "./files.service";

@Module({
  imports: [
    DatabaseConnectionModule,
    MongooseModule.forFeature([{ name: File.name, schema: FileSchema }]),
    MulterModule.register({
      dest: "./uploads" // Destination folder to store the uploaded files
    })
  ],
  controllers: [FilesController],
  providers: [FilesService]
})
export class FileModule {
}

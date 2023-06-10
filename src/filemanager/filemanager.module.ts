import { Module } from '@nestjs/common';
import { FilemanagerController } from './filemanager.controller';
import { MulterModule } from "@nestjs/platform-express";

@Module({
  imports:[
    MulterModule.register({
      dest: './uploads', // Destination folder to store the uploaded files
    }),
  ],
  controllers: [FilemanagerController],
  providers: []
})
export class FilemanagerModule {}

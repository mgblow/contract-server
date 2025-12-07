import { Module } from "@nestjs/common";
import { TexesService } from "./texes.service";
import { TexesController } from "./texes.controller";
import { ResponseService } from "../injection/response.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Tex, TexSchema } from "./entities/tex.entity";
import { DatabaseConnectionModule } from "../injection/DatabaseConnection";
import { RequestService } from "../injection/request.service";
import { MeiliSearchService } from "./meilisearch.service";

@Module({
  imports: [DatabaseConnectionModule, MongooseModule.forFeature([{ name: Tex.name, schema: TexSchema }])],
  controllers: [TexesController],
  providers: [TexesService, ResponseService, RequestService, MeiliSearchService]
})
export class TexesModule {
}

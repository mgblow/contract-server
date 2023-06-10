import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { BusinessesService } from "./businesses.service";
import { CreateBusinessPayload } from "./dto/create-business.payload";
import { UpdateBusinessPayload } from "./dto/update-business.payload";
import { DeleteBusinessPayload } from "./dto/delete-business.payload";
import { FindBusinessPayload } from "./dto/find-business.payload";
import { SearchBusinessesPayload } from "./dto/search-businesses.payload";
import { FetchBusinessesPayload } from "./dto/fetch-businesses.payload";

@Controller()
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {
  }

  @MessagePattern("createBusiness")
  createBusiness(@Payload() createBusinessDto: CreateBusinessPayload) {
    return this.businessesService.create(createBusinessDto);
  }

  @MessagePattern("updateBusiness")
  updateBusiness(@Payload() updateBusinessDto: UpdateBusinessPayload) {
    return this.businessesService.update(updateBusinessDto);
  }

  @MessagePattern("deleteBusiness")
  deleteBusiness(@Payload() deleteBusinessDto: DeleteBusinessPayload) {
    return this.businessesService.delete(deleteBusinessDto);
  }

  @MessagePattern("findBusiness")
  findBusiness(@Payload() findBusinessDto: FindBusinessPayload) {
    return this.businessesService.findById(findBusinessDto);
  }

  @MessagePattern("searchBusinesses")
  searchBusinesses(@Payload() searchBusinessesDto: SearchBusinessesPayload) {
    return this.businessesService.searchByQuery(searchBusinessesDto);
  }

  @MessagePattern("fetchBusinesses")
  fetchBusinesses(@Payload() fetchBusinessesDto: FetchBusinessesPayload) {
    return this.businessesService.fetchAll(fetchBusinessesDto);
  }

}

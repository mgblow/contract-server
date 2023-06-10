import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { CategoriesService } from "./categories.service";
import { CreateCategoryPayload } from "./dto/create-category.payload";
import { UpdateCategoryPayload } from "./dto/update-category.payload";
import { DeleteCategoryPayload } from "./dto/delete-category.payload";
import { FindCategoryPayload } from "./dto/find-category.payload";
import { SearchCategoriesPayload } from "./dto/search-categories.payload";
import { FetchCategoriesPayload } from "./dto/fetch-categories.payload";

@Controller()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {
  }

  @MessagePattern("createCategory")
  createCategory(@Payload() createCategoryDto: CreateCategoryPayload) {
    return this.categoriesService.create(createCategoryDto);
  }

  @MessagePattern("updateCategory")
  updateCategory(@Payload() updateCategoryDto: UpdateCategoryPayload) {
    return this.categoriesService.update(updateCategoryDto);
  }

  @MessagePattern("deleteCategory")
  deleteCategory(@Payload() deleteCategoryDto: DeleteCategoryPayload) {
    return this.categoriesService.delete(deleteCategoryDto);
  }

  @MessagePattern("findCategory")
  findCategory(@Payload() findCategoryDto: FindCategoryPayload) {
    return this.categoriesService.findById(findCategoryDto);
  }

  @MessagePattern("searchCategories")
  searchCategories(@Payload() searchCategoriesDto: SearchCategoriesPayload) {
    return this.categoriesService.searchByQuery(searchCategoriesDto);
  }

  @MessagePattern("fetchCategories")
  fetchCategories(@Payload() fetchCategoriesDto: FetchCategoriesPayload) {
    return this.categoriesService.fetchAll(fetchCategoriesDto);
  }

}

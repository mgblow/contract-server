import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CreateCategoryPayload } from "./dto/create-category.payload";
import { Category } from "./entities/category.entity";
import { UpdateCategoryPayload } from "./dto/update-category.payload";
import { ResponseService } from "../injection/response.service";
import { DeleteCategoryPayload } from "./dto/delete-category.payload";
import { FetchCategoriesPayload } from "./dto/fetch-categories.payload";
import { FindCategoryPayload } from "./dto/find-category.payload";
import { SearchCategoriesPayload } from "./dto/search-categories.payload";

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    private readonly responseService: ResponseService
  ) {
  }

  async create(createCategoryDto: CreateCategoryPayload): Promise<void> {
    // Check if category name already exists
    const existingCategory = await this.categoryModel.findOne({
      name: createCategoryDto.name
    }).exec();
    if (existingCategory) {
      await this.responseService.sendError(createCategoryDto.token.userFields.channel + "/createCategory", {
        "category.name": "category name already exists"
      });
    }
    // Check if category name already exists
    if (createCategoryDto.parent) {
      const existingParentCategory = await this.categoryModel.findOne({
        _id: createCategoryDto.parent
      }).exec();
      if (!existingParentCategory) {
        await this.responseService.sendError(createCategoryDto.token.userFields.channel + "/createCategory", {
          "category.parent": "category parent _id does not exists"
        });
      }
    }
    // Create new category and save to database
    const createdCategory = new this.categoryModel(createCategoryDto);
    const category = await createdCategory.save();
    await this.responseService.sendSuccess(createCategoryDto.token.userFields.channel + "/createCategory", category);
  }

  async update(updateCategoryDto: UpdateCategoryPayload): Promise<void> {
    // Find the category to update
    const existingCategory = await this.categoryModel.findById(updateCategoryDto._id).exec();
    if (!existingCategory) {
      await this.responseService.sendError(updateCategoryDto.token.userFields.channel + "/updateCategory", {
        "category._id": "category _id does not exists"
      });
    }

    // Check if category name already exists
    const existingCategoryWithName = await this.categoryModel.findOne({
      name: updateCategoryDto.name,
      _id: { $ne: updateCategoryDto._id }
    }).exec();
    if (existingCategoryWithName) {
      await this.responseService.sendError(updateCategoryDto.token.userFields.channel + "/updateCategory", {
        "category.name": "category name already exists"
      });
    }

    // Update the category and save to database
    existingCategory.set(updateCategoryDto);
    const updatedCategory = await existingCategory.save();
    await this.responseService.sendSuccess(updateCategoryDto.token.userFields.channel + "/updateCategory", updatedCategory);
  }


  async searchByQuery(searchCategoriesDto: SearchCategoriesPayload): Promise<void> {
    // Create a regular expression to use in searching the database
    const regex = new RegExp(searchCategoriesDto.query, "i");
    const categories = await this.categoryModel
      .find({ $or: [{ name: regex }, { about: regex }] })
      .exec();
    await this.responseService.sendSuccess(searchCategoriesDto.token.userFields.channel + "/searchCategories", categories);
  }

  async fetchAll(fetchCategoriesDto: FetchCategoriesPayload): Promise<void> {
    // Retrieve a paginated list of categories, along with the total count of categories
    const [categories, total] = await Promise.all([
      this.categoryModel.find().limit(fetchCategoriesDto.limit).skip(fetchCategoriesDto.limit * (fetchCategoriesDto.page - 1)).exec(),
      this.categoryModel.countDocuments()
    ]);
    await this.responseService.sendSuccess(fetchCategoriesDto.token.userFields.channel + "/fetchCategories", { categories, total });
  }

  async delete(deleteCategoryDto: DeleteCategoryPayload): Promise<void> {
    // Delete a category with a specific ID
    const deleted = await this.categoryModel.deleteOne({ _id: deleteCategoryDto._id }).exec();
    await this.responseService.sendSuccess(deleteCategoryDto.token.userFields.channel + "/deleteCategory", deleted);
  }

  async findById(findCategoryDto: FindCategoryPayload): Promise<void> {
    // Find a category with a specific ID
    const category = await this.categoryModel.findById(findCategoryDto._id).exec();
    await this.responseService.sendSuccess(findCategoryDto.token.userFields.channel + "/findCategory", category);
  }

}

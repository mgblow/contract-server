import { IsOptional, IsString, IsNumber, IsArray } from 'class-validator';
import { hobbiesList, businessTypes } from '../config/person.profile.config';

export class UpdateProfileDto {
  _id: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hobbies?: (typeof hobbiesList[number]['id'])[];

  @IsOptional()
  @IsString()
  business?: typeof businessTypes[number]['id'];

  @IsOptional()
  @IsString()
  customInterests?: string;
}

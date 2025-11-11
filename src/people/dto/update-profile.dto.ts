import { IsOptional, IsString, IsNumber, IsArray } from 'class-validator';
import { hobbiesList, businessTypes } from '../../picks/config/person.profile.config';

export class UpdateProfileDto {
  token: any;
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

  gender: string;
}

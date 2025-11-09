import { IsString, IsNumber, IsOptional, IsBoolean } from "class-validator";

export class CreatePickDto {
  @IsString()
  personId: string;

  @IsString()
  name: string;

  @IsString()
  type: string;


  @IsOptional()
  config?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsNumber()
  price: number;

  @IsOptional()
  meta?: Record<string, any>;

  token: any;
}

import { IsOptional, IsString, IsIn } from 'class-validator';
import {
  avatarStyles,
  topTypes,
  accessoriesTypes,
  hairColors,
  facialHairTypes,
  facialHairColors,
  clotheTypes,
  clotheColors,
  eyeTypes,
  eyebrowTypes,
  mouthTypes,
  skinColors,
} from '../config/person.avatar.config';

export class UpdateAvatarDto {

  token: any;
  _id: string

  @IsOptional()
  @IsIn(avatarStyles.map(a => a.value))
  avatarStyle?: string;

  @IsOptional()
  @IsIn(topTypes.map(t => t.value))
  topType?: string;

  @IsOptional()
  @IsIn(accessoriesTypes.map(a => a.value))
  accessoriesType?: string;

  @IsOptional()
  @IsIn(hairColors.map(h => h.value))
  hairColor?: string;

  @IsOptional()
  @IsIn(facialHairTypes.map(f => f.value))
  facialHairType?: string;

  @IsOptional()
  @IsIn(facialHairColors.map(f => f.value))
  facialHairColor?: string;

  @IsOptional()
  @IsIn(clotheTypes.map(c => c.value))
  clotheType?: string;

  @IsOptional()
  @IsIn(clotheColors.map(c => c.value))
  clotheColor?: string;

  @IsOptional()
  @IsIn(eyeTypes.map(e => e.value))
  eyeType?: string;

  @IsOptional()
  @IsIn(eyebrowTypes.map(e => e.value))
  eyebrowType?: string;

  @IsOptional()
  @IsIn(mouthTypes.map(m => m.value))
  mouthType?: string;

  @IsOptional()
  @IsIn(skinColors.map(s => s.value))
  skinColor?: string;
}

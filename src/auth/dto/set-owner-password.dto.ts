import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SetOwnerPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

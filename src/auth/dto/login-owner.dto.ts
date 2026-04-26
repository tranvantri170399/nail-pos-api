import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginOwnerDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

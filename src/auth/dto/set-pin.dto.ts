import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class SetPinDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}$/, { message: 'PIN must be exactly 4 digits' })
  pin: string;
}

import { IsString, MinLength } from 'class-validator';

export class UpdateAppointmentStatusDto {
  @IsString()
  @MinLength(2)
  status: string;
}

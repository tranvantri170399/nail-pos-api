import { Controller, Get } from '@nestjs/common';
import { StaffsService } from './staffs.service';

@Controller('staffs')
export class StaffsController {
  constructor(private readonly staffsService: StaffsService) {}

  @Get()
  findAll() {
    return this.staffsService.findAll();
  }
}
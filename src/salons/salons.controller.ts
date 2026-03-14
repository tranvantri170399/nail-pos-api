// salons/salons.controller.ts
import { Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { SalonsService } from './salons.service';
import { Salon } from './salon.entity';

@Controller('salons')
export class SalonsController {
  constructor(private readonly service: SalonsService) {}

  @Get()
  findAll(@Query('ownerId', ParseIntPipe) ownerId: number) {
    return this.service.findByOwner(ownerId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() body: Partial<Salon>) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Partial<Salon>) {
    return this.service.update(id, body);
  }
}
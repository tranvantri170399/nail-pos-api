// service-categories/service-categories.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ServiceCategoriesService } from './service-categories.service';
import { ServiceCategory } from './service-category.entity';

@Controller('service-categories')
export class ServiceCategoriesController {
  constructor(private readonly service: ServiceCategoriesService) {}

  @Get()
  findAll(@Query('salonId', ParseIntPipe) salonId: number) {
    return this.service.findBySalon(salonId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() body: Partial<ServiceCategory>) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Partial<ServiceCategory>) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
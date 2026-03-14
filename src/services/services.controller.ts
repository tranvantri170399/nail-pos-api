// services/services.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ServicesService } from './services.service';
import { Service } from './service.entity';

@Controller('services')
export class ServicesController {
  constructor(private readonly service: ServicesService) {}

  // GET /services?salonId=1
  @Get()
  findAll(@Query('salonId', ParseIntPipe) salonId: number) {
    return this.service.findBySalon(salonId);
  }

  // GET /services/by-category?categoryId=1
  @Get('by-category')
  findByCategory(@Query('categoryId', ParseIntPipe) categoryId: number) {
    return this.service.findByCategory(categoryId);
  }

  // GET /services/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  // POST /services
  @Post()
  create(@Body() body: Partial<Service>) {
    return this.service.create(body);
  }

  // PATCH /services/:id
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Partial<Service>) {
    return this.service.update(id, body);
  }

  // DELETE /services/:id
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
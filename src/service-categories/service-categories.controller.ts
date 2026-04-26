// service-categories/service-categories.controller.ts
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ServiceCategoriesService } from './service-categories.service';
import { ServiceCategory } from './service-category.entity';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';

@UseGuards(JwtAuthGuard)
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
  create(@Body() body: CreateServiceCategoryDto) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateServiceCategoryDto) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
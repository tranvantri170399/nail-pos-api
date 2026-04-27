// service-categories/service-categories.controller.ts
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SalonAccessGuard } from '../common/guards/salon-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ServiceCategoriesService } from './service-categories.service';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';

@UseGuards(JwtAuthGuard, SalonAccessGuard)
@Controller('service-categories')
export class ServiceCategoriesController {

  constructor(private readonly service: ServiceCategoriesService) {}

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('salonId') querySalonId?: string,
  ) {
    const salonId = user.type === 'owner' && querySalonId
      ? Number(querySalonId)
      : user.salonId;
    return this.service.findBySalon(salonId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id, user.salonId);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: CreateServiceCategoryDto) {
    const salonId = user.type === 'owner'
      ? ((body as any).salonId ?? user.salonId)
      : user.salonId;
    return this.service.create({ ...body, salonId });
  }

  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateServiceCategoryDto,
  ) {
    return this.service.update(id, body, user.salonId);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id, user.salonId);
  }
}
// services/services.controller.ts
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SalonAccessGuard } from '../common/guards/salon-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@UseGuards(JwtAuthGuard, SalonAccessGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly service: ServicesService) {}

  // GET /services?salonId=1 (owner) or auto from JWT (staff)
  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query() pagination: PaginationDto,
    @Query('salonId') querySalonId?: string,
  ) {
    const salonId = user.type === 'owner' && querySalonId
      ? Number(querySalonId)
      : user.salonId;
    return this.service.findBySalon(salonId, pagination);
  }

  // GET /services/by-category?categoryId=1
  @Get('by-category')
  findByCategory(@Query('categoryId', ParseIntPipe) categoryId: number) {
    return this.service.findByCategory(categoryId);
  }

  // GET /services/:id
  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id, user.salonId);
  }

  // POST /services
  @Post()
  create(@CurrentUser() user: any, @Body() body: CreateServiceDto) {
    const salonId = user.type === 'owner'
      ? ((body as any).salonId ?? (body as any).salon_id ?? user.salonId)
      : user.salonId;
    return this.service.create({ ...body, salonId });
  }

  // PATCH /services/:id
  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateServiceDto,
  ) {
    return this.service.update(id, body, user.salonId);
  }

  // DELETE /services/:id
  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id, user.salonId);
  }
}
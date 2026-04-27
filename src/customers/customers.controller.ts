import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SalonAccessGuard } from '../common/guards/salon-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@UseGuards(JwtAuthGuard, SalonAccessGuard)
@Controller('customers')
export class CustomersController {

  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query() pagination: PaginationDto,
    @Query('salonId') querySalonId?: string,
  ) {
    const salonId = user.type === 'owner' && querySalonId
      ? Number(querySalonId)
      : user.salonId;
    return this.customersService.findBySalon(salonId, pagination);
  }

  @Get('phone')
  findByPhoneQuery(
    @CurrentUser() user: any,
    @Query('phone') phone: string,
    @Query('salonId') querySalonId?: string,
  ) {
    const salonId = user.type === 'owner' && querySalonId
      ? Number(querySalonId)
      : user.salonId;
    return this.customersService.findByPhone(phone, salonId);
  }

  @Get('phone/:phone')
  findByPhone(
    @CurrentUser() user: any,
    @Param('phone') phone: string,
    @Query('salonId') querySalonId?: string,
  ) {
    const salonId = user.type === 'owner' && querySalonId
      ? Number(querySalonId)
      : user.salonId;
    return this.customersService.findByPhone(phone, salonId);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: CreateCustomerDto) {
    const salonId = user.type === 'owner'
      ? ((body as any).salonId ?? (body as any).salon_id ?? user.salonId)
      : user.salonId;
    return this.customersService.create({ ...body, salon_id: salonId });
  }

  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCustomerDto,
  ) {
    const salonId = user.type === 'owner' ? (user.salonId ?? undefined) : user.salonId;
    return this.customersService.update(id, body, salonId);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    const salonId = user.type === 'owner' ? (user.salonId ?? undefined) : user.salonId;
    return this.customersService.remove(id, salonId);
  }
}
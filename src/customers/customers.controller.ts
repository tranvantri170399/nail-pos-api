import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {

  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll(@Query('salonId') salonId?: string) {
    const parsedSalonId = salonId ? Number(salonId) : undefined;
    return parsedSalonId
      ? this.customersService.findBySalon(parsedSalonId)
      : this.customersService.findAll();
  }

  @Get('phone')
  findByPhoneQuery(@Query('phone') phone: string) {
    return this.customersService.findByPhone(phone);
  }

  @Get('phone/:phone')
  findByPhone(@Param('phone') phone: string) {
    return this.customersService.findByPhone(phone);
  }

  @Post()
  create(@Body() body: CreateCustomerDto) {
    return this.customersService.create(body);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateCustomerDto) {
    return this.customersService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.remove(id);
  }
}
// salons/salons.controller.ts
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SalonsService } from './salons.service';
import { Salon } from './salon.entity';

@UseGuards(JwtAuthGuard)
@Controller('salons')
export class SalonsController {

  constructor(private readonly service: SalonsService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    if (user.type === 'owner') {
      // Owner sees only their salons
      return this.service.findByOwner(user.id);
    }
    // Staff sees only their salon
    return this.service.findOne(user.salonId).then(s => [s]);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.findOneWithAccess(id, user);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: Partial<Salon>) {
    // Only owners can create salons
    return this.service.create({ ...body, ownerId: user.id });
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<Salon>,
  ) {
    return this.service.updateWithAccess(id, body, user);
  }
}
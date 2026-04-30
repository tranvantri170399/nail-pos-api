// src/waiting-list/waiting-list.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaitingListService } from './waiting-list.service';
import { WaitingListController } from './waiting-list.controller';
import { WaitingList } from './waiting-list.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WaitingList])],
  controllers: [WaitingListController],
  providers: [WaitingListService],
  exports: [WaitingListService],
})
export class WaitingListModule {}

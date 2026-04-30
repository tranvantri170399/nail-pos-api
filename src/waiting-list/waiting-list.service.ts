// src/waiting-list/waiting-list.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { WaitingList } from './waiting-list.entity';
import { CreateWaitingListDto, UpdateWaitingListDto } from './dto/create-waiting-list.dto';

@Injectable()
export class WaitingListService {
  constructor(
    @InjectRepository(WaitingList)
    private repo: Repository<WaitingList>,
    private dataSource: DataSource,
  ) {}

  async create(salonId: number, body: CreateWaitingListDto): Promise<WaitingList> {
    // Get current position (count of waiting items)
    const count = await this.repo.count({
      where: {
        salon_id: salonId,
        status: 'waiting',
      },
    });

    const waitingList = this.repo.create({
      salon_id: salonId,
      customer_id: body.customer_id,
      customer_name: body.customer_name,
      customer_phone: body.customer_phone,
      staff_id: body.staff_id,
      party_size: body.party_size ?? 1,
      status: 'waiting',
      notes: body.notes,
      position: count + 1,
    });
    return this.repo.save(waitingList);
  }

  async findBySalon(salonId: number, status?: string): Promise<WaitingList[]> {
    const where: any = { salon_id: salonId };
    if (status) {
      where.status = status;
    }
    return this.repo.find({
      where,
      order: { position: 'ASC', created_at: 'ASC' },
      relations: ['staff', 'customer'],
    });
  }

  async findOne(id: number, salonId: number): Promise<WaitingList> {
    const waitingList = await this.repo.findOne({
      where: { id },
      relations: ['staff', 'customer'],
    });
    if (!waitingList) throw new NotFoundException('Waiting list item not found');
    if (waitingList.salon_id !== salonId) {
      throw new ForbiddenException('Waiting list item does not belong to your salon');
    }
    return waitingList;
  }

  async update(id: number, salonId: number, body: UpdateWaitingListDto): Promise<WaitingList> {
    const waitingList = await this.findOne(id, salonId);

    const now = new Date();
    if (body.status === 'serving' && waitingList.status !== 'serving') {
      waitingList.started_at = now;
      waitingList.assigned_at = now;
    }
    if (body.status === 'completed' && waitingList.status !== 'completed') {
      waitingList.completed_at = now;
    }

    Object.assign(waitingList, body);
    return this.repo.save(waitingList);
  }

  async remove(id: number, salonId: number): Promise<void> {
    const waitingList = await this.findOne(id, salonId);

    // Update positions of remaining items
    await this.repo.manager.transaction(async manager => {
      await manager.remove(waitingList);
      
      // Reorder positions
      await manager
        .createQueryBuilder()
        .update(WaitingList)
        .set({ position: () => 'position - 1' })
        .where('salon_id = :salonId', { salonId })
        .andWhere('status = :status', { status: 'waiting' })
        .andWhere('position > :position', { position: waitingList.position })
        .execute();
    });
  }

  async assignStaff(id: number, salonId: number, staffId: number): Promise<WaitingList> {
    const waitingList = await this.findOne(id, salonId);
    waitingList.staff_id = staffId;
    waitingList.status = 'serving';
    waitingList.assigned_at = new Date();
    waitingList.started_at = new Date();
    return this.repo.save(waitingList);
  }

  async moveToNext(salonId: number): Promise<WaitingList | null> {
    // Find the first waiting item
    const nextItem = await this.repo.findOne({
      where: {
        salon_id: salonId,
        status: 'waiting',
      },
      order: { position: 'ASC' },
    });

    if (!nextItem) return null;

    // Move to serving status
    nextItem.status = 'serving';
    nextItem.assigned_at = new Date();
    nextItem.started_at = new Date();
    return this.repo.save(nextItem);
  }
}

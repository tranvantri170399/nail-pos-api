import { BadRequestException, Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { AppointmentService } from '../appointment-services/appointment-service.entity';
import { Staff } from '../staffs/staff.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { paginateRepository } from '../common/helpers/paginate.helper';
import { NotificationsService } from '../notifications/notifications.service';

const CANONICAL_STATUSES = ['scheduled', 'in_progress', 'done', 'cancelled', 'no_show'] as const;
const LEGACY_STATUS_MAP: Record<string, (typeof CANONICAL_STATUSES)[number]> = {
  pending: 'scheduled',
  confirmed: 'scheduled',
  completed: 'done',
};

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectRepository(Appointment)
    private repo: Repository<Appointment>,
    @InjectRepository(AppointmentService)
    private appointmentServiceRepo: Repository<AppointmentService>,
    @InjectRepository(Staff)
    private staffRepo: Repository<Staff>,
    private notificationsService: NotificationsService,
  ) {}

  findBySalon(salonId: number, pagination: PaginationDto): Promise<PaginatedResult<Appointment>> {
    return paginateRepository(this.repo, pagination, {
      where: { salon_id: salonId },
      relations: ['staff', 'customer', 'appointmentServices', 'appointmentServices.service'],
      order: { created_at: 'DESC' },
    });
  }

  findByDate(salonId: number, date: string) {
    return this.repo.find({
      where: { salon_id: salonId, scheduled_date: date },
      relations: ['staff', 'customer', 'appointmentServices', 'appointmentServices.service'],
      order: { start_time: 'ASC' },
    });
  }

  async search(salonId: number, query?: string, date?: string, status?: string) {
    const effectiveDate = date ?? this.todayInHoChiMinh();
    const statuses = this.parseStatusFilter(status);

    const qb = this.repo.createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.staff', 'staff')
      .leftJoinAndSelect('appointment.customer', 'customer')
      .leftJoinAndSelect('appointment.appointmentServices', 'appointmentServices')
      .leftJoinAndSelect('appointmentServices.service', 'service')
      .where('appointment.salon_id = :salonId', { salonId })
      .andWhere('appointment.scheduled_date = :date', { date: effectiveDate });

    if (statuses.length > 0) {
      qb.andWhere('appointment.status IN (:...statuses)', { statuses });
    }

    if (query?.trim()) {
      const term = `%${query.trim()}%`;
      qb.andWhere(new Brackets((subQb) => {
        subQb
          .where('customer.name ILIKE :term', { term })
          .orWhere('customer.phone ILIKE :term', { term })
          .orWhere('staff.name ILIKE :term', { term })
          .orWhere('appointment.note ILIKE :term', { term })
          .orWhere('appointment.id::text ILIKE :term', { term });
      }));
    }

    return qb
      .orderBy('appointment.start_time', 'ASC')
      .getMany();
  }

  async create(data: CreateAppointmentDto, userSalonId?: number) {
    if (!data.staff_id) {
      throw new BadRequestException('staff_id is required');
    }
    if (!data.start_time || !data.end_time || !data.scheduled_date) {
      throw new BadRequestException('scheduled_date, start_time and end_time are required');
    }

    const staff = await this.staffRepo.findOne({ where: { id: data.staff_id } });
    if (!staff) {
      throw new NotFoundException(`Staff #${data.staff_id} not found`);
    }

    // Validate staff belongs to user's salon
    if (userSalonId && staff.salonId !== userSalonId) {
      throw new ForbiddenException('Staff does not belong to your salon');
    }

    const salonId = staff.salonId;
    const appointmentStart = this.timeToMinutes(data.start_time);
    const appointmentEnd = this.timeToMinutes(data.end_time);
    const bufferMinutes = Number(data.buffer_minutes ?? 0);
    const normalizedStatus = this.normalizeStatus(data.status);

    if (appointmentEnd <= appointmentStart) {
      throw new BadRequestException('end_time must be after start_time');
    }

    return this.repo.manager.transaction(async (manager) => {
      // Lock staff+date to avoid double booking under concurrent requests.
      await manager.query('SELECT pg_advisory_xact_lock($1, $2)', [
        staff.id,
        this.dateLockKey(data.scheduled_date),
      ]);

      const appointmentRepo = manager.getRepository(Appointment);
      const appointmentServiceRepo = manager.getRepository(AppointmentService);

      const existingAppointments = await appointmentRepo.find({
        where: {
          salon_id: salonId,
          staff_id: staff.id,
          scheduled_date: data.scheduled_date,
        },
        order: { start_time: 'ASC' },
      });

      const conflict = existingAppointments.find((existing) =>
        this.isAppointmentConflict(existing, appointmentStart, appointmentEnd, bufferMinutes),
      );

      if (conflict) {
        throw new BadRequestException('Staff already has an overlapping appointment');
      }

      const appointmentPayload: Partial<Appointment> = {
        customer_id: data.customer_id,
        staff_id: data.staff_id,
        salon_id: salonId,
        scheduled_date: data.scheduled_date,
        start_time: data.start_time,
        end_time: data.end_time,
        total_minutes: data.total_minutes,
        total_price: data.total_price,
        buffer_minutes: bufferMinutes,
        status: normalizedStatus,
        note: data.note,
        source: data.source ?? 'walk_in',
      };

      const appointmentServices = data.appointment_services;
      const savedAppointment = await appointmentRepo.save(appointmentRepo.create(appointmentPayload));

      if (appointmentServices && Array.isArray(appointmentServices)) {
        for (const serviceData of appointmentServices) {
          await appointmentServiceRepo.save({
            appointmentId: savedAppointment.id,
            serviceId: serviceData.service_id,
            price: serviceData.price,
            durationMinutes: serviceData.duration_minutes,
          });
        }

        await this.recalculateTotals(savedAppointment.id, appointmentServiceRepo, appointmentRepo);
      }

      // Trigger notification for new appointment
      if (savedAppointment.customer_id) {
        setTimeout(async () => {
          try {
            await this.notificationsService.createAppointmentConfirmation(
              savedAppointment.id,
              salonId,
            );
          } catch (error) {
            this.logger.error('Failed to create appointment confirmation notification:', error);
          }
        }, 0);
      }

      return appointmentRepo.findOne({
        where: { id: savedAppointment.id },
        relations: ['staff', 'customer', 'appointmentServices', 'appointmentServices.service'],
      });
    });
  }

  async updateStatus(id: number, status: string, salonId?: number) {
    const appointment = await this.repo.findOne({ where: { id } });
    if (!appointment) throw new NotFoundException(`Appointment #${id} not found`);
    if (salonId && appointment.salon_id !== salonId) {
      throw new ForbiddenException('Appointment does not belong to your salon');
    }
    const normalizedStatus = this.normalizeStatus(status);
    await this.repo.update(id, { status: normalizedStatus });

    // Trigger notification for cancelled appointments
    if (normalizedStatus === 'cancelled' && appointment.customer_id) {
      setTimeout(async () => {
        try {
          await this.notificationsService.createAppointmentCancellation(id, appointment.salon_id);
        } catch (error) {
          this.logger.error('Failed to create appointment cancellation notification:', error);
        }
      }, 0);
    }

    return this.repo.findOne({ where: { id } });
  }

  async delete(id: number, salonId?: number) {
    const appointment = await this.repo.findOne({ where: { id } });
    if (!appointment) throw new NotFoundException(`Appointment #${id} not found`);
    if (salonId && appointment.salon_id !== salonId) {
      throw new ForbiddenException('Appointment does not belong to your salon');
    }
    // Delete related appointment services first
    await this.appointmentServiceRepo.delete({ appointmentId: id });
    
    await this.repo.delete(id);
    return { message: 'Deleted successfully' };
  }

  private async recalculateTotals(
    appointmentId: number,
    appointmentServiceRepo = this.appointmentServiceRepo,
    appointmentRepo = this.repo,
  ) {
    const services = await appointmentServiceRepo.find({
      where: { appointmentId },
    });

    const totalPrice = services.reduce((sum, service) => sum + Number(service.price), 0);
    const totalMinutes = services.reduce((sum, service) => sum + service.durationMinutes, 0);

    await appointmentRepo.update(appointmentId, {
      total_price: totalPrice,
      total_minutes: totalMinutes,
    });
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map((part) => Number(part));
    return hours * 60 + minutes;
  }

  private normalizeStatus(status: string): (typeof CANONICAL_STATUSES)[number] {
    const lower = status.trim().toLowerCase();
    if ((CANONICAL_STATUSES as readonly string[]).includes(lower)) {
      return lower as (typeof CANONICAL_STATUSES)[number];
    }

    const mapped = LEGACY_STATUS_MAP[lower];
    if (mapped) {
      return mapped;
    }

    throw new BadRequestException(
      `Invalid appointment status: ${status}. Allowed: ${CANONICAL_STATUSES.join(', ')}`,
    );
  }

  private parseStatusFilter(status?: string): string[] {
    if (!status) return [];
    return status
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => this.normalizeStatus(item));
  }

  private isAppointmentConflict(
    existing: Appointment,
    requestedStart: number,
    requestedEnd: number,
    requestedBufferMinutes: number,
  ): boolean {
    const normalizedStatus = this.normalizeStatus(existing.status);
    if (normalizedStatus === 'cancelled' || normalizedStatus === 'no_show') {
      return false;
    }

    const existingStart = this.timeToMinutes(existing.start_time);
    const existingEnd = this.timeToMinutes(existing.end_time) + Number(existing.buffer_minutes ?? 0);
    const requestedEffectiveEnd = requestedEnd + requestedBufferMinutes;

    return existingStart < requestedEffectiveEnd && requestedStart < existingEnd;
  }

  private todayInHoChiMinh(): string {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  }

  private dateLockKey(date: string): number {
    return Number(date.replace(/-/g, ''));
  }
}
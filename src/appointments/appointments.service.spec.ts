import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './appointment.entity';
import { AppointmentService } from '../appointment-services/appointment-service.entity';
import { Staff } from '../staffs/staff.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { NotificationsService } from '../notifications/notifications.service';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let repo: Repository<Appointment>;
  let appointmentServiceRepo: Repository<AppointmentService>;
  let staffRepo: Repository<Staff>;
  let notificationsService: NotificationsService;

  const mockAppointmentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
    count: jest.fn(),
    findAndCount: jest.fn(),
    manager: {
      transaction: jest.fn(),
    },
  };

  const mockAppointmentServiceRepository = {
    save: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  const mockStaffRepository = {
    findOne: jest.fn(),
  };

  const mockNotificationsService = {
    createAppointmentConfirmation: jest.fn(),
    createAppointmentCancellation: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: getRepositoryToken(Appointment),
          useValue: mockAppointmentRepository,
        },
        {
          provide: getRepositoryToken(AppointmentService),
          useValue: mockAppointmentServiceRepository,
        },
        {
          provide: getRepositoryToken(Staff),
          useValue: mockStaffRepository,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    repo = module.get<Repository<Appointment>>(getRepositoryToken(Appointment));
    appointmentServiceRepo = module.get<Repository<AppointmentService>>(
      getRepositoryToken(AppointmentService),
    );
    staffRepo = module.get<Repository<Staff>>(getRepositoryToken(Staff));
    notificationsService = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findBySalon', () => {
    it('should return paginated appointments for a salon', async () => {
      const mockAppointments = [
        { id: 1, salon_id: 1, staff: { name: 'John' } },
        { id: 2, salon_id: 1, staff: { name: 'Jane' } },
      ];

      mockAppointmentRepository.findAndCount.mockResolvedValue([mockAppointments, 2]);

      const result = await service.findBySalon(1, { page: 1, limit: 10 });

      expect(result.data).toEqual(mockAppointments);
      expect(result.meta.total).toBe(2);
    });
  });

  describe('findByDate', () => {
    it('should return appointments for a specific date', async () => {
      const mockAppointments = [
        { id: 1, scheduled_date: '2024-01-01', start_time: '09:00' },
      ];

      mockAppointmentRepository.find.mockResolvedValue(mockAppointments);

      const result = await service.findByDate(1, '2024-01-01');

      expect(result).toEqual(mockAppointments);
      expect(mockAppointmentRepository.find).toHaveBeenCalledWith({
        where: { salon_id: 1, scheduled_date: '2024-01-01' },
        relations: ['staff', 'customer', 'appointmentServices', 'appointmentServices.service'],
        order: { start_time: 'ASC' },
      });
    });
  });

  describe('search', () => {
    it('should search appointments with query and date filter', async () => {
      mockAppointmentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.search(1, 'John', '2024-01-01', 'scheduled');

      expect(mockAppointmentRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('appointment.salon_id = :salonId', { salonId: 1 });
    });

    it('should search appointments with only date filter', async () => {
      mockAppointmentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.search(1, undefined, '2024-01-01');

      expect(mockAppointmentRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    const createDto: CreateAppointmentDto = {
      staff_id: 1,
      scheduled_date: '2024-01-01',
      start_time: '09:00',
      end_time: '10:00',
      total_minutes: 60,
      total_price: 100,
      status: 'scheduled',
      appointment_services: [
        {
          service_id: 1,
          price: 100,
          duration_minutes: 60,
        },
      ],
    };

    const mockStaff = {
      id: 1,
      name: 'John',
      salonId: 1,
      isActive: true,
    };

    it('should successfully create an appointment', async () => {
      mockStaffRepository.findOne.mockResolvedValue(mockStaff);
      mockAppointmentRepository.manager.transaction.mockImplementation(async (callback) => {
        const manager = {
          getRepository: jest.fn().mockReturnValue({
            create: jest.fn().mockReturnValue({ id: 1 }),
            save: jest.fn().mockResolvedValue({ id: 1 }),
            findOne: jest.fn().mockResolvedValue({ id: 1 }),
            find: jest.fn().mockResolvedValue([]),
            update: jest.fn(),
            query: jest.fn(),
          }),
          query: jest.fn(),
        };
        return callback(manager);
      });

      const result = await service.create(createDto, 1);

      expect(mockStaffRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockAppointmentRepository.manager.transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if staff_id is missing', async () => {
      const invalidDto = { ...createDto, staff_id: undefined };

      await expect(service.create(invalidDto as any)).rejects.toThrow(BadRequestException);
      await expect(service.create(invalidDto as any)).rejects.toThrow('staff_id is required');
    });

    it('should throw BadRequestException if required time fields are missing', async () => {
      const invalidDto = { ...createDto, start_time: undefined };

      await expect(service.create(invalidDto as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if staff not found', async () => {
      mockStaffRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto, 1)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto, 1)).rejects.toThrow('Staff #1 not found');
    });

    it('should throw ForbiddenException if staff does not belong to salon', async () => {
      const staffFromDifferentSalon = { ...mockStaff, salonId: 2 };
      mockStaffRepository.findOne.mockResolvedValue(staffFromDifferentSalon);

      await expect(service.create(createDto, 1)).rejects.toThrow(ForbiddenException);
      await expect(service.create(createDto, 1)).rejects.toThrow('Staff does not belong to your salon');
    });

    it('should throw BadRequestException if end_time is before start_time', async () => {
      const invalidDto = { ...createDto, start_time: '10:00', end_time: '09:00' };
      mockStaffRepository.findOne.mockResolvedValue(mockStaff);
      mockAppointmentRepository.manager.transaction.mockImplementation(async (callback) => {
        const manager = {
          getRepository: jest.fn().mockReturnValue({
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn().mockResolvedValue([]),
            update: jest.fn(),
            query: jest.fn(),
          }),
          query: jest.fn(),
        };
        return callback(manager);
      });

      await expect(service.create(invalidDto, 1)).rejects.toThrow(BadRequestException);
      await expect(service.create(invalidDto, 1)).rejects.toThrow('end_time must be after start_time');
    });

    it('should normalize legacy status "pending" to "scheduled"', async () => {
      const pendingDto: CreateAppointmentDto = {
        ...createDto,
        status: 'pending',
      };
      mockStaffRepository.findOne.mockResolvedValue(mockStaff);
      mockAppointmentRepository.manager.transaction.mockImplementation(async (callback) => {
        const manager = {
          getRepository: jest.fn().mockReturnValue({
            create: jest.fn().mockReturnValue({ id: 1 }),
            save: jest.fn().mockResolvedValue({ id: 1, status: 'scheduled' }),
            findOne: jest.fn().mockResolvedValue({ id: 1, status: 'scheduled' }),
            find: jest.fn().mockResolvedValue([]),
            update: jest.fn(),
            query: jest.fn(),
          }),
          query: jest.fn(),
        };
        return callback(manager);
      });

      await service.create(pendingDto, 1);
      // Should not throw error, status should be normalized
    });

    it('should throw BadRequestException for invalid status', async () => {
      const invalidDto: CreateAppointmentDto = {
        ...createDto,
        status: 'invalid_status',
      };
      mockStaffRepository.findOne.mockResolvedValue(mockStaff);
      mockAppointmentRepository.manager.transaction.mockImplementation(async (callback) => {
        const manager = {
          getRepository: jest.fn().mockReturnValue({
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn().mockResolvedValue([]),
            update: jest.fn(),
            query: jest.fn(),
          }),
          query: jest.fn(),
        };
        return callback(manager);
      });

      await expect(service.create(invalidDto, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('should successfully update appointment status', async () => {
      const mockAppointment = { id: 1, salon_id: 1, status: 'scheduled', customer_id: 1 };
      mockAppointmentRepository.findOne.mockResolvedValue(mockAppointment);
      mockAppointmentRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateStatus(1, 'in_progress', 1);

      expect(mockAppointmentRepository.update).toHaveBeenCalledWith(1, { status: 'in_progress' });
    });

    it('should throw NotFoundException if appointment not found', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue(null);

      await expect(service.updateStatus(1, 'in_progress')).rejects.toThrow(NotFoundException);
      await expect(service.updateStatus(1, 'in_progress')).rejects.toThrow('Appointment #1 not found');
    });

    it('should throw ForbiddenException if appointment does not belong to salon', async () => {
      const mockAppointment = { id: 1, salon_id: 2, status: 'scheduled' };
      mockAppointmentRepository.findOne.mockResolvedValue(mockAppointment);

      await expect(service.updateStatus(1, 'in_progress', 1)).rejects.toThrow(ForbiddenException);
      await expect(service.updateStatus(1, 'in_progress', 1)).rejects.toThrow(
        'Appointment does not belong to your salon',
      );
    });
  });

  describe('delete', () => {
    it('should successfully delete an appointment', async () => {
      const mockAppointment = { id: 1, salon_id: 1 };
      mockAppointmentRepository.findOne.mockResolvedValue(mockAppointment);
      appointmentServiceRepo.delete = jest.fn().mockResolvedValue({ affected: 1 });
      mockAppointmentRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.delete(1, 1);

      expect(appointmentServiceRepo.delete).toHaveBeenCalledWith({ appointmentId: 1 });
      expect(mockAppointmentRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual({ message: 'Deleted successfully' });
    });

    it('should throw NotFoundException if appointment not found', async () => {
      mockAppointmentRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(1)).rejects.toThrow(NotFoundException);
      await expect(service.delete(1)).rejects.toThrow('Appointment #1 not found');
    });

    it('should throw ForbiddenException if appointment does not belong to salon', async () => {
      const mockAppointment = { id: 1, salon_id: 2 };
      mockAppointmentRepository.findOne.mockResolvedValue(mockAppointment);

      await expect(service.delete(1, 1)).rejects.toThrow(ForbiddenException);
      await expect(service.delete(1, 1)).rejects.toThrow('Appointment does not belong to your salon');
    });
  });
});

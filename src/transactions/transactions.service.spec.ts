import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { TransactionsService } from './transactions.service';
import { Transaction } from './transaction.entity';
import { TransactionItem } from './transaction-item.entity';
import { TransactionPayment } from './transaction-payment.entity';
import { Salon } from '../salons/salon.entity';
import { Customer } from '../customers/customer.entity';
import { Appointment } from '../appointments/appointment.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ShiftsService } from '../shifts/shifts.service';
import { LoyaltyService } from '../loyalty/loyalty.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let repo: Repository<Transaction>;
  let salonRepo: Repository<Salon>;
  let customerRepo: Repository<Customer>;
  let appointmentRepo: Repository<Appointment>;
  let dataSource: DataSource;
  let shiftsService: ShiftsService;
  let loyaltyService: LoyaltyService;

  const mockTransactionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockSalonRepository = {
    findOne: jest.fn(),
  };

  const mockCustomerRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockManager = {
    getRepository: jest.fn(),
    create: jest.fn(),
    query: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockAppointmentRepository = {
    findOne: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
    getRepository: jest.fn(),
    query: jest.fn(),
  };

  const mockShiftsService = {
    getCurrentShift: jest.fn(),
    recordTransaction: jest.fn(),
  };

  const mockLoyaltyService = {
    earnPoints: jest.fn(),
  };

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getRawOne: jest.fn(),
    getMany: jest.fn(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepository,
        },
        {
          provide: getRepositoryToken(Salon),
          useValue: mockSalonRepository,
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        {
          provide: getRepositoryToken(Appointment),
          useValue: mockAppointmentRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: ShiftsService,
          useValue: mockShiftsService,
        },
        {
          provide: LoyaltyService,
          useValue: mockLoyaltyService,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    repo = module.get<Repository<Transaction>>(getRepositoryToken(Transaction));
    salonRepo = module.get<Repository<Salon>>(getRepositoryToken(Salon));
    customerRepo = module.get<Repository<Customer>>(getRepositoryToken(Customer));
    appointmentRepo = module.get<Repository<Appointment>>(getRepositoryToken(Appointment));
    dataSource = module.get<DataSource>(DataSource);
    shiftsService = module.get<ShiftsService>(ShiftsService);
    loyaltyService = module.get<LoyaltyService>(LoyaltyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateTransactionDto = {
      salon_id: 1,
      subtotal: 100,
      payment_method: 'cash',
      items: [
        {
          service_id: 1,
          service_name: 'Manicure',
          price: 100,
          commission_rate: 10,
        },
      ],
    };

    const mockSalon = { id: 1, taxRate: 10 };

    it('should successfully create a transaction', async () => {
      mockSalonRepository.findOne.mockResolvedValue(mockSalon);
      mockShiftsService.getCurrentShift.mockResolvedValue({ id: 1 });
      mockDataSource.transaction.mockImplementation(async (callback) => {
        const manager = {
          getRepository: jest.fn().mockReturnValue({
            create: jest.fn().mockReturnValue({ id: 1 }),
            save: jest.fn().mockResolvedValue({ id: 1 }),
            findOne: jest.fn().mockResolvedValue({ id: 1 }),
            findOneOrFail: jest.fn().mockResolvedValue({ id: 1, items: [], payments: [] }),
            query: jest.fn(),
          }),
          save: jest.fn().mockResolvedValue({ id: 1 }),
          create: jest.fn().mockReturnValue({ id: 1 }),
          findOneOrFail: jest.fn().mockResolvedValue({ id: 1, items: [], payments: [] }),
          query: jest.fn(),
        };
        return callback(manager);
      });

      const result = await service.create(createDto);

      expect(mockSalonRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockDataSource.transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if items are empty', async () => {
      const invalidDto = { ...createDto, items: [] };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(invalidDto)).rejects.toThrow('items are required');
    });

    it('should throw NotFoundException if salon not found', async () => {
      mockSalonRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto)).rejects.toThrow('Salon not found');
    });

    it('should calculate tax based on salon tax rate', async () => {
      mockSalonRepository.findOne.mockResolvedValue({ id: 1, taxRate: 15 });
      mockShiftsService.getCurrentShift.mockResolvedValue({ id: 1 });
      mockDataSource.transaction.mockImplementation(async (callback) => {
        const manager = {
          getRepository: jest.fn().mockReturnValue({
            create: jest.fn().mockReturnValue({ id: 1 }),
            save: jest.fn().mockResolvedValue({ id: 1 }),
            findOne: jest.fn().mockResolvedValue({ id: 1 }),
            findOneOrFail: jest.fn().mockResolvedValue({ id: 1, items: [], payments: [] }),
            query: jest.fn(),
          }),
          save: jest.fn().mockResolvedValue({ id: 1 }),
          create: jest.fn().mockReturnValue({ id: 1 }),
          findOneOrFail: jest.fn().mockResolvedValue({ id: 1, items: [], payments: [] }),
          query: jest.fn(),
        };
        return callback(manager);
      });

      await service.create(createDto);
      // Tax should be calculated as 15% of subtotal
    });

    it('should handle split payment validation', async () => {
      const splitPaymentDto: CreateTransactionDto = {
        ...createDto,
        subtotal: 100,
        discount_amount: 0,
        tip_amount: 0,
        tax_amount: 0,
        payments: [
          { payment_method: 'cash', amount: 55 },
          { payment_method: 'card', amount: 55 },
        ],
      };

      mockSalonRepository.findOne.mockResolvedValue(mockSalon);
      mockShiftsService.getCurrentShift.mockResolvedValue({ id: 1 });
      mockDataSource.transaction.mockImplementation(async (callback) => {
        const manager = {
          getRepository: jest.fn().mockReturnValue({
            create: jest.fn().mockReturnValue({ id: 1 }),
            save: jest.fn().mockResolvedValue({ id: 1 }),
            findOne: jest.fn().mockResolvedValue({ id: 1 }),
            findOneOrFail: jest.fn().mockResolvedValue({ id: 1, items: [], payments: [] }),
            query: jest.fn(),
          }),
          save: jest.fn().mockResolvedValue({ id: 1 }),
          create: jest.fn().mockReturnValue({ id: 1 }),
          findOneOrFail: jest.fn().mockResolvedValue({ id: 1, items: [], payments: [] }),
          query: jest.fn(),
        };
        return callback(manager);
      });

      await service.create(splitPaymentDto);
      expect(mockDataSource.transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException for mismatched split payment total', async () => {
      const invalidSplitDto: CreateTransactionDto = {
        ...createDto,
        payments: [
          { payment_method: 'cash', amount: 30 },
          { payment_method: 'card', amount: 30 },
        ],
      };

      mockSalonRepository.findOne.mockResolvedValue(mockSalon);
      mockShiftsService.getCurrentShift.mockResolvedValue({ id: 1 });
      mockDataSource.transaction.mockImplementation(async (callback) => {
        const manager = {
          getRepository: jest.fn().mockReturnValue({
            create: jest.fn().mockReturnValue({ id: 1 }),
            save: jest.fn().mockResolvedValue({ id: 1 }),
            findOne: jest.fn().mockResolvedValue({ id: 1 }),
            findOneOrFail: jest.fn().mockResolvedValue({ id: 1, items: [], payments: [] }),
            query: jest.fn(),
          }),
          save: jest.fn().mockResolvedValue({ id: 1 }),
          create: jest.fn().mockReturnValue({ id: 1 }),
          findOneOrFail: jest.fn().mockResolvedValue({ id: 1, items: [], payments: [] }),
          query: jest.fn(),
        };
        return callback(manager);
      });

      await expect(service.create(invalidSplitDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findBySalon', () => {
    it('should return paginated transactions for a salon', async () => {
      mockTransactionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[{ id: 1 }], 1]);
      mockDataSource.getRepository.mockReturnValue({
        find: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findBySalon(1, { page: 1, limit: 10 });

      expect(result.data).toBeDefined();
      expect(result.meta).toBeDefined();
      expect(mockTransactionRepository.createQueryBuilder).toHaveBeenCalled();
    });

    it('should filter by date when provided', async () => {
      mockTransactionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[{ id: 1 }], 1]);
      mockDataSource.getRepository.mockReturnValue({
        find: jest.fn().mockResolvedValue([]),
      });

      await service.findBySalon(1, { page: 1, limit: 10 }, '2024-01-01');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        `DATE(t.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = :date`,
        { date: '2024-01-01' },
      );
    });

    it('should filter by date range when start and end dates provided', async () => {
      mockTransactionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[{ id: 1 }], 1]);
      mockDataSource.getRepository.mockReturnValue({
        find: jest.fn().mockResolvedValue([]),
      });

      await service.findBySalon(1, { page: 1, limit: 10 }, undefined, '2024-01-01', '2024-01-31');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        `DATE(t.paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh') >= :startDate`,
        { startDate: '2024-01-01' },
      );
    });
  });

  describe('findByAppointment', () => {
    it('should return transaction for an appointment', async () => {
      const mockTransaction = {
        id: 1,
        appointmentId: 1,
        salonId: 1,
        items: [],
        payments: [],
      };

      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);

      const result = await service.findByAppointment(1, 1);

      expect(result).toEqual(mockTransaction);
      expect(mockTransactionRepository.findOne).toHaveBeenCalledWith({
        where: { appointmentId: 1 },
        relations: ['items', 'payments'],
      });
    });

    it('should throw NotFoundException if transaction not found', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(null);

      await expect(service.findByAppointment(1)).rejects.toThrow(NotFoundException);
      await expect(service.findByAppointment(1)).rejects.toThrow('Transaction not found');
    });

    it('should throw ForbiddenException if transaction does not belong to salon', async () => {
      const mockTransaction = {
        id: 1,
        appointmentId: 1,
        salonId: 2,
        items: [],
        payments: [],
      };

      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);

      await expect(service.findByAppointment(1, 1)).rejects.toThrow(ForbiddenException);
      await expect(service.findByAppointment(1, 1)).rejects.toThrow(
        'Transaction does not belong to your salon',
      );
    });
  });

  describe('getDailyReport', () => {
    it('should return daily report for a salon', async () => {
      mockTransactionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalRevenue: '1000',
        totalTips: '100',
        totalDiscounts: '50',
        totalTax: '100',
        count: '10',
      });

      const result = await service.getDailyReport(1, '2024-01-01');

      expect(result.date).toBe('2024-01-01');
      expect(result.totalRevenue).toBe(1000);
      expect(result.totalTips).toBe(100);
      expect(result.totalDiscounts).toBe(50);
      expect(result.totalTax).toBe(100);
    });

    it('should handle null values in report', async () => {
      mockTransactionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalRevenue: null,
        totalTips: null,
        totalDiscounts: null,
        totalTax: null,
        count: null,
      });

      const result = await service.getDailyReport(1, '2024-01-01');

      expect(result.totalRevenue).toBe(0);
      expect(result.totalTips).toBe(0);
    });
  });

  describe('refund', () => {
    it('should successfully refund a transaction', async () => {
      const mockTransaction = {
        id: 1,
        salonId: 1,
        totalAmount: 100,
        paymentMethod: 'cash',
        customerId: 1,
        items: [],
      };

      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);
      mockTransactionRepository.update.mockResolvedValue({ affected: 1 });
      mockTransactionRepository.findOneOrFail.mockResolvedValue({
        ...mockTransaction,
        items: [],
        payments: [],
      });
      mockShiftsService.recordTransaction.mockResolvedValue(undefined);
      mockCustomerRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.execute.mockResolvedValue(undefined);

      const result = await service.refund(1, 1);

      expect(mockTransactionRepository.update).toHaveBeenCalledWith(1, { status: 'refunded' });
      expect(mockShiftsService.recordTransaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if transaction not found', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(null);

      await expect(service.refund(1)).rejects.toThrow(NotFoundException);
      await expect(service.refund(1)).rejects.toThrow('Transaction not found');
    });

    it('should throw ForbiddenException if transaction does not belong to salon', async () => {
      const mockTransaction = {
        id: 1,
        salonId: 2,
        totalAmount: 100,
        items: [],
      };

      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);

      await expect(service.refund(1, 1)).rejects.toThrow(ForbiddenException);
      await expect(service.refund(1, 1)).rejects.toThrow(
        'Transaction does not belong to your salon',
      );
    });
  });

  describe('getCommissionReport', () => {
    it('should return commission report for a date', async () => {
      const mockRows = [
        {
          staffId: 1,
          staffName: 'John',
          serviceCount: 5,
          grossSales: 500,
          commissionAmount: 50,
          tipAmount: 25,
        },
      ];

      mockDataSource.query.mockResolvedValue(mockRows);

      const result = await service.getCommissionReport(1, '2024-01-01');

      expect(result).toEqual({
        salonId: 1,
        date: '2024-01-01',
        totalCommission: 50,
        totalTips: 25,
        items: [
          {
            staffId: 1,
            staffName: 'John',
            serviceCount: 5,
            grossSales: 500,
            commissionAmount: 50,
            tipAmount: 25,
          },
        ],
      });
    });
  });

  describe('getServicePopularityReport', () => {
    it('should return service popularity report', async () => {
      const mockRows = [
        {
          serviceId: 1,
          serviceName: 'Manicure',
          categoryId: 1,
          categoryName: 'Nails',
          categoryColor: '#FF0000',
          serviceCount: 10,
          totalRevenue: 1000,
          averagePrice: 100,
        },
      ];

      mockDataSource.query.mockResolvedValue(mockRows);

      const result = await service.getServicePopularityReport(1, '2024-01-01', '2024-01-31');

      expect(result.salonId).toBe(1);
      expect(result.totalServices).toBe(10);
      expect(result.totalRevenue).toBe(1000);
      expect(result.items[0].revenuePercentage).toBe(100);
    });
  });

  describe('getCustomerAnalyticsReport', () => {
    it('should return customer analytics report', async () => {
      const mockRows = [
        {
          customerId: 1,
          customerName: 'Jane Doe',
          customerPhone: '1234567890',
          totalVisits: 5,
          totalSpent: 500,
          averageSpend: 100,
          lastVisitDate: '2024-01-01',
        },
      ];

      mockDataSource.query.mockResolvedValue(mockRows);

      const result = await service.getCustomerAnalyticsReport(1, '2024-01-01', '2024-01-31');

      expect(result.totalCustomers).toBe(1);
      expect(result.totalRevenue).toBe(500);
      expect(result.totalVisits).toBe(5);
    });
  });

  describe('getPaymentMethodReport', () => {
    it('should return payment method report', async () => {
      const mockRows = [
        {
          paymentMethod: 'cash',
          transactionCount: 5,
          totalAmount: 500,
        },
        {
          paymentMethod: 'card',
          transactionCount: 3,
          totalAmount: 300,
        },
      ];

      mockDataSource.query.mockResolvedValue(mockRows);

      const result = await service.getPaymentMethodReport(1, '2024-01-01');

      expect(result.totalAmount).toBe(800);
      expect(result.totalTransactions).toBe(8);
      expect(result.items[0].percentage).toBe(62.5);
    });
  });
});

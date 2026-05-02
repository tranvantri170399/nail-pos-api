import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { Staff } from '../staffs/staff.entity';
import { Owner } from '../owners/owner.entity';
import { Salon } from '../salons/salon.entity';

describe('AuthService', () => {
  let service: AuthService;
  let staffRepo: Repository<Staff>;
  let ownerRepo: Repository<Owner>;
  let salonRepo: Repository<Salon>;
  let jwtService: JwtService;

  const mockStaffRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockOwnerRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockSalonRepository = {
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  // Mock bcryptjs
  const bcrypt = require('bcryptjs');
  jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
  jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashed'));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Staff),
          useValue: mockStaffRepository,
        },
        {
          provide: getRepositoryToken(Owner),
          useValue: mockOwnerRepository,
        },
        {
          provide: getRepositoryToken(Salon),
          useValue: mockSalonRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    staffRepo = module.get<Repository<Staff>>(getRepositoryToken(Staff));
    ownerRepo = module.get<Repository<Owner>>(getRepositoryToken(Owner));
    salonRepo = module.get<Repository<Salon>>(getRepositoryToken(Salon));
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loginStaff', () => {
    const validStaff = {
      id: 1,
      name: 'John Doe',
      phone: '1234567890',
      pinCode: '$2a$10$hashedpin',
      salonId: 1,
      role: 'senior',
      color: '#FF0000',
      isActive: true,
    };

    it('should successfully login staff with valid credentials', async () => {
      mockStaffRepository.findOne.mockResolvedValue(validStaff);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt_token');

      const result = await service.loginStaff('1234567890', '1234');

      expect(result).toEqual({
        access_token: 'jwt_token',
        user: {
          id: 1,
          salon_id: 1,
          name: 'John Doe',
          role: 'senior',
          color: '#FF0000',
          type: 'staff',
        },
      });
      expect(staffRepo.findOne).toHaveBeenCalledWith({ where: { phone: '1234567890' } });
      expect(bcrypt.compare).toHaveBeenCalledWith('1234', validStaff.pinCode);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        name: 'John Doe',
        role: 'senior',
        type: 'staff',
        salonId: 1,
      });
    });

    it('should throw UnauthorizedException when staff not found', async () => {
      mockStaffRepository.findOne.mockResolvedValue(null);

      await expect(service.loginStaff('1234567890', '1234')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.loginStaff('1234567890', '1234')).rejects.toThrow(
        'Số điện thoại không tồn tại',
      );
    });

    it('should throw UnauthorizedException when staff is inactive', async () => {
      const inactiveStaff = { ...validStaff, isActive: false };
      mockStaffRepository.findOne.mockResolvedValue(inactiveStaff);

      await expect(service.loginStaff('1234567890', '1234')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.loginStaff('1234567890', '1234')).rejects.toThrow(
        'Tài khoản đã bị khoá',
      );
    });

    it('should throw UnauthorizedException when PIN is incorrect', async () => {
      mockStaffRepository.findOne.mockResolvedValue(validStaff);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.loginStaff('1234567890', '1234')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.loginStaff('1234567890', '1234')).rejects.toThrow(
        'PIN không đúng',
      );
    });
  });

  describe('loginOwner', () => {
    const validOwner = {
      id: 1,
      name: 'Jane Smith',
      phone: '0987654321',
      password: '$2a$10$hashedpassword',
      salon_name: 'Nail Salon',
      is_active: true,
    };

    const validSalon = {
      id: 1,
      name: 'Nail Salon',
    };

    it('should successfully login owner with valid credentials', async () => {
      mockOwnerRepository.findOne.mockResolvedValue(validOwner);
      mockSalonRepository.findOne.mockResolvedValue(validSalon);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt_token');

      const result = await service.loginOwner('0987654321', 'password123');

      expect(result).toEqual({
        access_token: 'jwt_token',
        user: {
          id: 1,
          name: 'Jane Smith',
          salon_name: 'Nail Salon',
          role: 'owner',
          type: 'owner',
          salonId: 1,
          salonName: 'Nail Salon',
        },
      });
      expect(ownerRepo.findOne).toHaveBeenCalledWith({ where: { phone: '0987654321' } });
      expect(salonRepo.findOne).toHaveBeenCalledWith({ where: { ownerId: 1 } });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', validOwner.password);
    });

    it('should throw UnauthorizedException when owner not found', async () => {
      mockOwnerRepository.findOne.mockResolvedValue(null);

      await expect(service.loginOwner('0987654321', 'password123')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.loginOwner('0987654321', 'password123')).rejects.toThrow(
        'Số điện thoại không tồn tại',
      );
    });

    it('should throw UnauthorizedException when owner is inactive', async () => {
      const inactiveOwner = { ...validOwner, is_active: false };
      mockOwnerRepository.findOne.mockResolvedValue(inactiveOwner);

      await expect(service.loginOwner('0987654321', 'password123')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.loginOwner('0987654321', 'password123')).rejects.toThrow(
        'Tài khoản đã bị khoá',
      );
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      mockOwnerRepository.findOne.mockResolvedValue(validOwner);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.loginOwner('0987654321', 'password123')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.loginOwner('0987654321', 'password123')).rejects.toThrow(
        'Mật khẩu không đúng',
      );
    });

    it('should handle case when salon is not found', async () => {
      mockOwnerRepository.findOne.mockResolvedValue(validOwner);
      mockSalonRepository.findOne.mockResolvedValue(null);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt_token');

      const result = await service.loginOwner('0987654321', 'password123');

      expect(result.user.salonId).toBeUndefined();
      expect(result.user.salonName).toBeUndefined();
    });
  });

  describe('setPin', () => {
    it('should successfully set PIN for staff', async () => {
      mockStaffRepository.update.mockResolvedValue({ affected: 1 });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pin');

      const result = await service.setPin(1, '1234');

      expect(result).toEqual({ message: 'PIN đã được cập nhật' });
      expect(bcrypt.hash).toHaveBeenCalledWith('1234', 10);
      expect(staffRepo.update).toHaveBeenCalledWith(1, { pinCode: 'hashed_pin' });
    });
  });

  describe('setOwnerPassword', () => {
    it('should successfully set password for owner', async () => {
      mockOwnerRepository.update.mockResolvedValue({ affected: 1 });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      const result = await service.setOwnerPassword(1, 'newpassword');

      expect(result).toEqual({ message: 'Mật khẩu đã được cập nhật' });
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
      expect(ownerRepo.update).toHaveBeenCalledWith(1, { password: 'hashed_password' });
    });
  });
});

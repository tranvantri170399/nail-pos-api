import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/staff/login (POST)', () => {
    it('should login staff with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/staff/login')
        .send({
          phone: '1234567890',
          pin: '1234',
        })
        .expect(201);
    });

    it('should return 401 for invalid phone', () => {
      return request(app.getHttpServer())
        .post('/auth/staff/login')
        .send({
          phone: '0000000000',
          pin: '1234',
        })
        .expect(401);
    });

    it('should return 401 for invalid PIN', () => {
      return request(app.getHttpServer())
        .post('/auth/staff/login')
        .send({
          phone: '1234567890',
          pin: '0000',
        })
        .expect(401);
    });

    it('should validate DTO - phone is required', () => {
      return request(app.getHttpServer())
        .post('/auth/staff/login')
        .send({
          pin: '1234',
        })
        .expect(400);
    });

    it('should validate DTO - pin must be 4 digits', () => {
      return request(app.getHttpServer())
        .post('/auth/staff/login')
        .send({
          phone: '1234567890',
          pin: '123',
        })
        .expect(400);
    });
  });

  describe('/auth/owner/login (POST)', () => {
    it('should login owner with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/owner/login')
        .send({
          phone: '0987654321',
          password: 'password123',
        })
        .expect(201);
    });

    it('should return 401 for invalid phone', () => {
      return request(app.getHttpServer())
        .post('/auth/owner/login')
        .send({
          phone: '0000000000',
          password: 'password123',
        })
        .expect(401);
    });

    it('should return 401 for invalid password', () => {
      return request(app.getHttpServer())
        .post('/auth/owner/login')
        .send({
          phone: '0987654321',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should validate DTO - password must be at least 6 characters', () => {
      return request(app.getHttpServer())
        .post('/auth/owner/login')
        .send({
          phone: '0987654321',
          password: '12345',
        })
        .expect(400);
    });
  });

  describe('/auth/staff/set-pin/:staffId (POST)', () => {
    it('should update staff PIN', () => {
      return request(app.getHttpServer())
        .post('/auth/staff/set-pin/1')
        .send({
          pin: '5678',
        })
        .expect(200);
    });

    it('should validate DTO - pin must be 4 digits', () => {
      return request(app.getHttpServer())
        .post('/auth/staff/set-pin/1')
        .send({
          pin: '567',
        })
        .expect(400);
    });
  });

  describe('/auth/owner/set-password/:ownerId (POST)', () => {
    it('should update owner password', () => {
      return request(app.getHttpServer())
        .post('/auth/owner/set-password/1')
        .send({
          password: 'newpassword123',
        })
        .expect(200);
    });

    it('should validate DTO - password must be at least 6 characters', () => {
      return request(app.getHttpServer())
        .post('/auth/owner/set-password/1')
        .send({
          password: '12345',
        })
        .expect(400);
    });
  });
});

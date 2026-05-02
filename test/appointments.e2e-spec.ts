import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppointmentsController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Login as staff to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/staff/login')
      .send({
        phone: '1234567890',
        pin: '1234',
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/appointments (GET)', () => {
    it('should get appointments for a salon with auth', () => {
      return request(app.getHttpServer())
        .get('/appointments?salon_id=1&page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/appointments?salon_id=1&page=1&limit=10')
        .expect(401);
    });
  });

  describe('/appointments/date/:date (GET)', () => {
    it('should get appointments for a specific date', () => {
      return request(app.getHttpServer())
        .get('/appointments/date/2024-01-01?salon_id=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('/appointments/search (GET)', () => {
    it('should search appointments with query', () => {
      return request(app.getHttpServer())
        .get('/appointments/search?salon_id=1&query=John&date=2024-01-01')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should search appointments with status filter', () => {
      return request(app.getHttpServer())
        .get('/appointments/search?salon_id=1&status=scheduled&date=2024-01-01')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('/appointments (POST)', () => {
    it('should create a new appointment', () => {
      return request(app.getHttpServer())
        .post('/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
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
        })
        .expect(201);
    });

    it('should validate DTO - staff_id is required', () => {
      return request(app.getHttpServer())
        .post('/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          scheduled_date: '2024-01-01',
          start_time: '09:00',
          end_time: '10:00',
          total_minutes: 60,
          total_price: 100,
          status: 'scheduled',
        })
        .expect(400);
    });

    it('should validate DTO - end_time must be after start_time', () => {
      return request(app.getHttpServer())
        .post('/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          staff_id: 1,
          scheduled_date: '2024-01-01',
          start_time: '10:00',
          end_time: '09:00',
          total_minutes: 60,
          total_price: 100,
          status: 'scheduled',
        })
        .expect(400);
    });
  });

  describe('/appointments/:id/status (PATCH)', () => {
    it('should update appointment status', () => {
      return request(app.getHttpServer())
        .patch('/appointments/1/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'in_progress',
        })
        .expect(200);
    });

    it('should return 404 for non-existent appointment', () => {
      return request(app.getHttpServer())
        .patch('/appointments/99999/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'in_progress',
        })
        .expect(404);
    });
  });

  describe('/appointments/:id (DELETE)', () => {
    it('should delete an appointment', () => {
      return request(app.getHttpServer())
        .delete('/appointments/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should return 404 for non-existent appointment', () => {
      return request(app.getHttpServer())
        .delete('/appointments/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});

import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { StaffsModule } from './staffs/staffs.module';
import { ServicesModule } from './services/services.module';
import { CustomersModule } from './customers/customers.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AppointmentServicesModule } from './appointment-services/appointment-services.module';
import { AuthModule } from './auth/auth.module';
import { OwnersModule } from './owners/owners.module';
import { SalonsModule } from './salons/salons.module';
import { ServiceCategoriesModule } from './service-categories/service-categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ShiftsModule } from './shifts/shifts.module';
import { PayrollsModule } from './payrolls/payrolls.module';
import { WaitingListModule } from './waiting-list/waiting-list.module';
import { SchedulesModule } from './schedules/schedules.module';
import { TimeClocksModule } from './time-clocks/time-clocks.module';
import { HealthModule } from './health/health.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { NotificationsModule } from './notifications/notifications.module';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { envValidationSchema } from './common/config/env.validation';
import { UploadsModule } from './uploads/uploads.module';
import { BackupModule } from './backup/backup.module';

@Module({
  imports: [
    // Load .env with validation
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per minute
      },
    ]),
    // Redis caching - temporarily disabled due to configuration issues
    // CacheModule.registerAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (config: ConfigService) => ({
    //     store: redisStore,
    //     host: config.get<string>('REDIS_HOST', 'localhost'),
    //     port: config.get<number>('REDIS_PORT', 6379),
    //     password: config.get<string>('REDIS_PASSWORD', ''),
    //     ttl: 3600, // Default TTL: 1 hour
    //     isGlobal: true,
    //   }),
    // }),

    // Kết nối PostgreSQL — hardcoded Supabase connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: 'aws-1-ap-southeast-1.pooler.supabase.com',
        port: 6543,
        username: 'postgres.jxzhloosntfeitpbylzp',
        password: config.get<string>('DB_PASSWORD', 'Tposreal1999$$'),
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        autoLoadEntities: true,
        synchronize: false,
        migrations: ['dist/migrations/*.js'],
        migrationsRun: true,
        logging: config.get<string>('DB_LOGGING', 'false') === 'true',
        poolSize: config.get<number>('DB_POOL_SIZE', 10),
        extra: {
          max: config.get<number>('DB_POOL_MAX', 20),
          idleTimeoutMillis: config.get<number>('DB_POOL_IDLE_TIMEOUT', 30000),
          connectionTimeoutMillis: config.get<number>('DB_POOL_CONNECTION_TIMEOUT', 2000),
        },
      }),
    }),
    
    StaffsModule,
    ServicesModule,
    CustomersModule,
    AppointmentsModule,
    AppointmentServicesModule,
    AuthModule,
    OwnersModule,
    SalonsModule,
    ServiceCategoriesModule,
    TransactionsModule,
    ShiftsModule,
    PayrollsModule,
    WaitingListModule,
    SchedulesModule,
    TimeClocksModule,
    HealthModule,
    LoyaltyModule,
    NotificationsModule,
    UploadsModule,
    BackupModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
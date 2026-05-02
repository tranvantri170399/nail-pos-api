import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-ioredis';
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

    // Kết nối PostgreSQL — dùng env variables + migrations
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Try Render individual variables first (avoid IPv6 issues with DATABASE_URL)
        const renderHost = config.get<string>('DATABASE_HOST');
        const renderPort = config.get<string>('DATABASE_PORT');
        const renderUser = config.get<string>('DATABASE_USERNAME');
        const renderPass = config.get<string>('DATABASE_PASSWORD');
        const renderDb = config.get<string>('DATABASE_NAME');
        
        if (renderHost && renderUser && renderPass) {
          // Use Render individual variables
          return {
            type: 'postgres' as const,
            host: renderHost,
            port: parseInt(renderPort || '5432', 10),
            username: renderUser,
            password: renderPass,
            database: renderDb || 'postgres',
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
          };
        }
        
        // Otherwise, try DATABASE_URL
        const databaseUrl = config.get<string>('DATABASE_URL');
        if (databaseUrl) {
          const url = new URL(databaseUrl);
          return {
            type: 'postgres' as const,
            host: url.hostname,
            port: parseInt(url.port) || 5432,
            username: url.username,
            password: url.password,
            database: url.pathname.slice(1),
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
          };
        }
        
        // Fallback to individual DB_* variables (local dev)
        return {
          type: 'postgres' as const,
          host: config.get<string>('DB_HOST', 'aws-1-ap-southeast-1.pooler.supabase.com'),
          port: config.get<number>('DB_PORT', 6543),
          username: config.get<string>('DB_USERNAME', 'postgres.jxzhloosntfeitpbylzp'),
          password: config.get<string>('DB_PASSWORD', 'Tposreal1999$$'),
          database: config.get<string>('DB_DATABASE', 'postgres'),
          ssl: config.get<string>('DB_SSL', 'true') === 'true'
            ? { rejectUnauthorized: false }
            : false,
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
        };
      },
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
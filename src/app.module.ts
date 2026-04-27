import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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

@Module({
  imports: [
    // Load .env
    ConfigModule.forRoot({ isGlobal: true }),

    // Kết nối PostgreSQL — dùng env variables + migrations
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
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
        synchronize: false, // Dùng migration thay vì synchronize
        migrations: ['dist/migrations/*.js'],
        migrationsRun: true, // Tự chạy migration khi app start
        logging: config.get<string>('DB_LOGGING', 'false') === 'true',
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
    
  ],
})
export class AppModule { }
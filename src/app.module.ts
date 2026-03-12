import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffsModule } from './staffs/staffs.module';
import { ServicesModule } from './services/services.module';
import { CustomersModule } from './customers/customers.module';
import { AppointmentsModule } from './appointments/appointments.module';

@Module({
  imports: [
    // Load .env
    ConfigModule.forRoot({ isGlobal: true }),

    // Kết nối Supabase PostgreSQL
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'aws-1-ap-southeast-1.pooler.supabase.com',
      port: 6543,
      username: 'postgres.jxzhloosntfeitpbylzp',
      password: 'Tposreal1999$$',
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      autoLoadEntities: true,
      synchronize: false,
    }),
    
    StaffsModule,
    ServicesModule,
    CustomersModule,
    AppointmentsModule,
  ],
})
export class AppModule { }
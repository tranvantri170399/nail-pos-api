// transactions/transactions.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';
import { TransactionItem } from './transaction-item.entity';
import { TransactionPayment } from './transaction-payment.entity';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { ShiftsModule } from '../shifts/shifts.module';
import { Salon } from '../salons/salon.entity';
import { Customer } from '../customers/customer.entity';
import { Appointment } from '../appointments/appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, TransactionItem, TransactionPayment, Salon, Customer, Appointment]),
    ShiftsModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}

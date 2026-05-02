import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as winston from 'winston';
dotenv.config();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    }),
  ),
  transports: [new winston.transports.Console()],
});

import { Owner } from './owners/owner.entity';
import { Salon } from './salons/salon.entity';
import { Staff } from './staffs/staff.entity';
import { Customer } from './customers/customer.entity';
import { ServiceCategory } from './service-categories/service-category.entity';
import { Service } from './services/service.entity';
import { Appointment } from './appointments/appointment.entity';
import { AppointmentService } from './appointment-services/appointment-service.entity';
import { Transaction } from './transactions/transaction.entity';
import { TransactionItem } from './transactions/transaction-item.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'aws-1-ap-southeast-1.pooler.supabase.com',
  port: Number(process.env.DB_PORT ?? 6543),
  username: process.env.DB_USERNAME ?? 'postgres.jxzhloosntfeitpbylzp',
  password: process.env.DB_PASSWORD ?? 'Tposreal1999$$',
  database: process.env.DB_DATABASE ?? 'postgres',
  ssl: { rejectUnauthorized: false },
  entities: [
    Owner, Salon, Staff, Customer,
    ServiceCategory, Service,
    Appointment, AppointmentService,
    Transaction, TransactionItem,
  ],
  synchronize: false,
});

async function seed() {
  await AppDataSource.initialize();
  logger.info('✅ Connected to database');

  // ── TRUNCATE (chạy lại seed nhiều lần không bị lỗi) ─────
  await AppDataSource.query(`TRUNCATE TABLE transaction_items, transactions, appointment_services, appointments, services, service_categories, customers, staffs, salons, owners RESTART IDENTITY CASCADE`);
  logger.info('✅ Tables cleared');

  // ── PATCH SCHEMA: thêm cột còn thiếu nếu chưa có ────────
  await AppDataSource.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS salon_id INTEGER`);
  await AppDataSource.query(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS salon_id INTEGER`);
  await AppDataSource.query(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS total_minutes INTEGER NOT NULL DEFAULT 0`);
  await AppDataSource.query(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS total_price NUMERIC NOT NULL DEFAULT 0`);
  logger.info('✅ Schema patched');

  // ── OWNER ────────────────────────────────────────────────
  const ownerRepo = AppDataSource.getRepository(Owner);
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  const owner = ownerRepo.create({
    name: 'Nguyễn Văn An',
    phone: '0901234567',
    password: hashedPassword,
    salon_name: 'Nail Salon Hồng',
    is_active: true,
  });
  await ownerRepo.save(owner);
  logger.info(`✅ Owner: ${owner.name} (id=${owner.id}) | phone: 0901234567 | pass: Admin@123`);

  // ── SALON ────────────────────────────────────────────────
  const salonRepo = AppDataSource.getRepository(Salon);
  const salon = salonRepo.create({
    ownerId: owner.id,
    name: 'Nail Salon Hồng',
    phone: '0901234567',
    email: 'nailsalon@example.com',
    address: '123 Nguyễn Huệ, Quận 1',
    city: 'TP. Hồ Chí Minh',
    openingTime: '09:00',
    closingTime: '20:00',
    timezone: 'Asia/Ho_Chi_Minh',
    currency: 'VND',
    slotDuration: 15,
    isActive: true,
  });
  await salonRepo.save(salon);
  logger.info(`✅ Salon: ${salon.name} (id=${salon.id})`);

  // ── STAFFS ───────────────────────────────────────────────
  const staffRepo = AppDataSource.getRepository(Staff);
  const staffData = [
    { name: 'Trần Thị Bảo',  phone: '0911111111', pin: '1234', role: 'senior', commission: 30, color: '#FF6B9D' },
    { name: 'Lê Văn Cường',  phone: '0922222222', pin: '2345', role: 'junior', commission: 20, color: '#4ECDC4' },
    { name: 'Phạm Thị Dung', phone: '0933333333', pin: '3456', role: 'junior', commission: 25, color: '#45B7D1' },
  ];
  const staffs: Staff[] = [];
  for (const s of staffData) {
    const hashedPin = await bcrypt.hash(s.pin, 10);
    const staff = staffRepo.create({
      salonId: salon.id,
      name: s.name,
      phone: s.phone,
      pinCode: hashedPin,
      role: s.role,
      commissionRate: s.commission,
      color: s.color,
      isActive: true,
    });
    await staffRepo.save(staff);
    staffs.push(staff);
    logger.info(`✅ Staff: ${staff.name} (id=${staff.id}) | PIN: ${s.pin}`);
  }

  // ── CUSTOMERS ────────────────────────────────────────────
  const customerRepo = AppDataSource.getRepository(Customer);
  const customerData = [
    { name: 'Nguyễn Thị Em',  phone: '0912345678' },
    { name: 'Trần Văn Phúc',  phone: '0923456789' },
    { name: 'Lê Thị Giang',   phone: '0934567890' },
    { name: 'Phạm Văn Hùng',  phone: '0945678901' },
    { name: 'Hoàng Thị Lan',  phone: '0956789012' },
  ];
  const customers: Customer[] = [];
  for (const c of customerData) {
    const customer = customerRepo.create({
      salon_id: salon.id,
      name: c.name,
      phone: c.phone,
      total_visits: 0,
      total_spent: 0,
    });
    await customerRepo.save(customer);
    customers.push(customer);
  }
  logger.info(`✅ Customers: ${customers.length} records`);

  // ── SERVICE CATEGORIES ───────────────────────────────────
  const catRepo = AppDataSource.getRepository(ServiceCategory);
  const catData = [
    { name: 'Nail Gel',    color: '#FF6B9D' },
    { name: 'Nail Acrylic', color: '#9B59B6' },
    { name: 'Nail Art',    color: '#F39C12' },
  ];
  const categories: ServiceCategory[] = [];
  for (const c of catData) {
    const cat = catRepo.create({ salonId: salon.id, name: c.name, color: c.color, isActive: true });
    await catRepo.save(cat);
    categories.push(cat);
  }
  logger.info(`✅ Service Categories: ${categories.length} records`);

  // ── SERVICES ─────────────────────────────────────────────
  const serviceRepo = AppDataSource.getRepository(Service);
  const serviceData = [
    // Nail Gel
    { catIdx: 0, name: 'Gel Basic',   price: 150000, duration: 45, color: '#FF6B9D' },
    { catIdx: 0, name: 'Gel French',  price: 200000, duration: 60, color: '#FFB6C1' },
    { catIdx: 0, name: 'Gel Color',   price: 180000, duration: 50, color: '#FF69B4' },
    // Nail Acrylic
    { catIdx: 1, name: 'Acrylic Full Set', price: 350000, duration: 90, color: '#9B59B6' },
    { catIdx: 1, name: 'Acrylic Fill',     price: 250000, duration: 60, color: '#8E44AD' },
    // Nail Art
    { catIdx: 2, name: 'Nail Art Basic',  price: 50000,  duration: 30, color: '#F39C12' },
    { catIdx: 2, name: 'Nail Art Design', price: 100000, duration: 45, color: '#E67E22' },
    { catIdx: 2, name: 'Nail Extension',  price: 120000, duration: 60, color: '#D35400' },
  ];
  const services: Service[] = [];
  for (const s of serviceData) {
    const svc = serviceRepo.create({
      salonId: salon.id,
      categoryId: categories[s.catIdx].id,
      name: s.name,
      price: s.price,
      durationMinutes: s.duration,
      color: s.color,
      isActive: true,
    });
    await serviceRepo.save(svc);
    services.push(svc);
  }
  logger.info(`✅ Services: ${services.length} records`);

  // ── APPOINTMENTS ─────────────────────────────────────────
  const apptRepo = AppDataSource.getRepository(Appointment);
  const apptSvcRepo = AppDataSource.getRepository(AppointmentService);

  // Appointment 1: hôm nay - Customer 1 - Staff 1 - Gel Basic + Nail Art Basic
  const today = new Date().toISOString().split('T')[0];
  const appt1 = apptRepo.create({
    salon_id: salon.id,
    customer_id: customers[0].id,
    staff_id: staffs[0].id,
    scheduled_date: today,
    start_time: '10:00',
    end_time: '11:15',
    total_minutes: 75,
    total_price: 200000,
    status: 'completed',
    source: 'walk_in',
  });
  await apptRepo.save(appt1);
  await apptSvcRepo.save([
    apptSvcRepo.create({ appointmentId: appt1.id, serviceId: services[0].id, price: services[0].price, durationMinutes: services[0].durationMinutes }),
    apptSvcRepo.create({ appointmentId: appt1.id, serviceId: services[5].id, price: services[5].price, durationMinutes: services[5].durationMinutes }),
  ]);

  // Appointment 2: ngày mai - Customer 2 - Staff 2 - Acrylic Fill
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const appt2 = apptRepo.create({
    salon_id: salon.id,
    customer_id: customers[1].id,
    staff_id: staffs[1].id,
    scheduled_date: tomorrow,
    start_time: '14:00',
    end_time: '15:00',
    total_minutes: 60,
    total_price: 250000,
    status: 'confirmed',
    source: 'walk_in',
  });
  await apptRepo.save(appt2);
  await apptSvcRepo.save([
    apptSvcRepo.create({ appointmentId: appt2.id, serviceId: services[4].id, price: services[4].price, durationMinutes: services[4].durationMinutes }),
  ]);
  logger.info(`✅ Appointments: 2 records`);

  // ── TRANSACTIONS ─────────────────────────────────────────
  const txRepo = AppDataSource.getRepository(Transaction);
  const txItemRepo = AppDataSource.getRepository(TransactionItem);

  // Transaction 1: thanh toán tiền mặt cho appt1
  const tx1 = txRepo.create({
    salonId: salon.id,
    appointmentId: appt1.id,
    subtotal: 200000,
    discountAmount: 0,
    tipAmount: 20000,
    taxAmount: 0,
    totalAmount: 220000,
    paymentMethod: 'cash',
    status: 'paid',
    paidAt: new Date(),
  });
  await txRepo.save(tx1);
  await txItemRepo.save([
    txItemRepo.create({
      transactionId: tx1.id,
      serviceId: services[0].id,
      staffId: staffs[0].id,
      serviceName: services[0].name,
      price: services[0].price,
      commissionRate: 30,
      commissionAmount: (services[0].price * 30) / 100,
    }),
    txItemRepo.create({
      transactionId: tx1.id,
      serviceId: services[5].id,
      staffId: staffs[0].id,
      serviceName: services[5].name,
      price: services[5].price,
      commissionRate: 30,
      commissionAmount: (services[5].price * 30) / 100,
    }),
  ]);

  // Transaction 2: chuyển khoản cho appt2 (pending)
  const tx2 = txRepo.create({
    salonId: salon.id,
    appointmentId: appt2.id,
    subtotal: 250000,
    discountAmount: 0,
    tipAmount: 0,
    taxAmount: 0,
    totalAmount: 250000,
    paymentMethod: 'transfer',
    status: 'pending',
  });
  await txRepo.save(tx2);
  await txItemRepo.save([
    txItemRepo.create({
      transactionId: tx2.id,
      serviceId: services[4].id,
      staffId: staffs[1].id,
      serviceName: services[4].name,
      price: services[4].price,
      commissionRate: 20,
      commissionAmount: (services[4].price * 20) / 100,
    }),
  ]);
  logger.info(`✅ Transactions: 2 records`);

  await AppDataSource.destroy();
  logger.info('\n🎉 Seed hoàn tất!');
  logger.info('──────────────────────────────');
  logger.info('🔑 Owner login:  phone=0901234567  password=Admin@123');
  logger.info('👤 Staff 1 PIN:  phone=0911111111  PIN=1234');
  logger.info('👤 Staff 2 PIN:  phone=0922222222  PIN=2345');
  logger.info('👤 Staff 3 PIN:  phone=0933333333  PIN=3456');
}

seed().catch((err) => {
  logger.error('❌ Seed failed:', err);
  process.exit(1);
});

// notifications/notifications.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notification } from './notification.entity';
import { Appointment } from '../appointments/appointment.entity';
import { Customer } from '../customers/customer.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
  ) {}

  /**
   * Create an appointment reminder notification
   */
  async createAppointmentReminder(
    appointmentId: number,
    salonId: number,
    scheduledAt: Date,
  ): Promise<Notification> {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['customer'],
    });

    if (!appointment || !appointment.customer) {
      throw new Error('Appointment or customer not found');
    }

    const notification = this.notificationRepo.create({
      salonId,
      appointmentId,
      customerId: appointment.customer_id,
      type: 'appointment_reminder',
      channel: 'in_app', // Default to in_app, can be extended to SMS/Zalo
      title: 'Nhắc lịch hẹn',
      message: `Bạn có lịch hẹn vào ${appointment.start_time} ngày ${appointment.scheduled_date}. Hẹn gặp lại!`,
      status: 'pending',
      scheduledAt,
    });

    return this.notificationRepo.save(notification);
  }

  /**
   * Create a notification for appointment confirmation
   */
  async createAppointmentConfirmation(
    appointmentId: number,
    salonId: number,
  ): Promise<Notification> {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['customer'],
    });

    if (!appointment || !appointment.customer) {
      throw new Error('Appointment or customer not found');
    }

    const notification = this.notificationRepo.create({
      salonId,
      appointmentId,
      customerId: appointment.customer_id,
      type: 'appointment_confirmed',
      channel: 'in_app',
      title: 'Xác nhận lịch hẹn',
      message: `Lịch hẹn của bạn vào ${appointment.start_time} ngày ${appointment.scheduled_date} đã được xác nhận.`,
      status: 'pending',
    });

    return this.notificationRepo.save(notification);
  }

  /**
   * Create a notification for appointment cancellation
   */
  async createAppointmentCancellation(
    appointmentId: number,
    salonId: number,
  ): Promise<Notification> {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['customer'],
    });

    if (!appointment || !appointment.customer) {
      throw new Error('Appointment or customer not found');
    }

    const notification = this.notificationRepo.create({
      salonId,
      appointmentId,
      customerId: appointment.customer_id,
      type: 'appointment_cancelled',
      channel: 'in_app',
      title: 'Lịch hẹn đã bị hủy',
      message: `Lịch hẹn của bạn vào ${appointment.start_time} ngày ${appointment.scheduled_date} đã bị hủy.`,
      status: 'pending',
    });

    return this.notificationRepo.save(notification);
  }

  /**
   * Get notifications for a customer
   */
  async getCustomerNotifications(customerId: number): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  /**
   * Get notifications for a salon
   */
  async getSalonNotifications(salonId: number): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { salonId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  /**
   * Mark notification as read/sent
   */
  async markAsSent(notificationId: number): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.status = 'sent';
    notification.sentAt = new Date();

    return this.notificationRepo.save(notification);
  }

  /**
   * Cron job: Send pending notifications
   * Runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async sendPendingNotifications() {
    this.logger.log('Checking for pending notifications...');

    const now = new Date();
    const pendingNotifications = await this.notificationRepo.find({
      where: {
        status: 'pending',
        scheduledAt: LessThan(now),
      },
    });

    for (const notification of pendingNotifications) {
      try {
        // Simulate sending notification
        // In production, this would integrate with SMS/Zalo/email services
        await this.sendNotification(notification);
        notification.status = 'sent';
        notification.sentAt = new Date();
        await this.notificationRepo.save(notification);
        this.logger.log(`Notification ${notification.id} sent successfully`);
      } catch (error) {
        notification.status = 'failed';
        notification.error = error.message;
        await this.notificationRepo.save(notification);
        this.logger.error(`Failed to send notification ${notification.id}:`, error);
      }
    }
  }

  /**
   * Simulate sending notification
   * In production, integrate with actual SMS/Zalo/email providers
   */
  private async sendNotification(notification: Notification): Promise<void> {
    // This is a placeholder for actual notification sending
    // Production implementation would call SMS/Zalo/email APIs
    this.logger.log(
      `Sending ${notification.channel} notification to customer ${notification.customerId}: ${notification.message}`,
    );

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Schedule appointment reminders
   * Runs daily at 8 AM to schedule reminders for appointments in the next 24 hours
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async scheduleDailyReminders() {
    this.logger.log('Scheduling daily appointment reminders...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const appointments = await this.appointmentRepo.find({
      where: {
        scheduled_date: tomorrow,
        status: 'scheduled',
      },
      relations: ['customer'],
    });

    for (const appointment of appointments) {
      if (appointment.customer && appointment.customer.phone) {
        // Schedule reminder for 2 hours before appointment
        const appointmentDateTime = new Date(
          `${appointment.scheduled_date}T${appointment.start_time}`,
        );
        const reminderTime = new Date(appointmentDateTime.getTime() - 2 * 60 * 60 * 1000);

        await this.createAppointmentReminder(
          appointment.id,
          appointment.salon_id,
          reminderTime,
        );
        this.logger.log(`Scheduled reminder for appointment ${appointment.id}`);
      }
    }
  }
}

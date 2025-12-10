import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { Notification } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class AppService {
  constructor(
    @InjectPinoLogger(AppService.name)
    private readonly logger: PinoLogger,
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async create(data: Partial<Notification>) {
    const notification = this.notificationsRepository.create(data);
    const savedNotification =
      await this.notificationsRepository.save(notification);

    // Send Real-time
    this.notificationsGateway.notifyUser(
      savedNotification.userId,
      savedNotification,
    );

    return savedNotification;
  }

  async findAll(userId: string) {
    this.logger.debug({ userId }, 'Finding all notifications');
    const pending = await this.notificationsRepository.find({
      where: { userId, readAt: IsNull() },
      order: { createdAt: 'DESC' },
    });

    const lastRead = await this.notificationsRepository.find({
      where: { userId, readAt: Not(IsNull()) },
      order: { createdAt: 'DESC' },
      take: 3,
    });

    return [...pending, ...lastRead];
  }

  async markAsRead(id: string) {
    await this.notificationsRepository.update(id, {
      readAt: new Date(),
    });
    return { success: true };
  }

  async markAsReadByTaskId(userId: string, taskId: string) {
    this.logger.info({ userId, taskId }, 'Mark as read by task ID');

    // Safer approach: Find pending notifications for this task, then update them.
    const notifications = await this.notificationsRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .andWhere("notification.metadata->>'taskId' = :taskId", { taskId })
      .andWhere('notification.readAt IS NULL')
      .getMany();

    if (notifications.length > 0) {
      const ids = notifications.map((n) => n.id);
      await this.notificationsRepository.update(ids, {
        readAt: new Date(),
      });
      this.logger.info(
        { count: ids.length, taskId },
        'Marked notifications as read',
      );
    }

    return { success: true, count: notifications.length };
  }
}

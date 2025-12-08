import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class AppService {
  constructor(
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
    return this.notificationsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string) {
    await this.notificationsRepository.update(id, { readAt: new Date() });
    return this.notificationsRepository.findOne({ where: { id } });
  }
}

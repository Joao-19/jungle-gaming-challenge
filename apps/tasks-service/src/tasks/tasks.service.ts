import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreateTaskDto,
  UpdateTaskDto,
  GetTasksFilterDto,
  TaskStatus,
  TaskPriority,
} from '@repo/dtos';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,

    // Injeta o cliente RabbitMQ configurado no módulo
    @Inject('NOTIFICATIONS_SERVICE') private readonly client: ClientProxy,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string) {
    const task = this.tasksRepository.create({
      ...createTaskDto,
      status: TaskStatus.TODO,
      priority: createTaskDto.priority || TaskPriority.LOW,
      userId: userId,
      assigneeIds: createTaskDto.assigneeIds || [],
    });

    const savedTask = await this.tasksRepository.save(task);

    this.client.emit('task_created', savedTask);

    return savedTask;
  }

  async findAll(filters: GetTasksFilterDto) {
    const {
      title,
      status,
      priority,
      assigneeId,
      dueDate,
      page = 1,
      limit = 10,
    } = filters;
    const query = this.tasksRepository.createQueryBuilder('task');

    if (title) {
      query.andWhere('task.title ILIKE :title', { title: `%${title}%` });
    }

    if (status) {
      query.andWhere('task.status = :status', { status });
    }

    if (priority) {
      query.andWhere('task.priority = :priority', { priority });
    }

    if (assigneeId) {
      // Como assigneeIds é um simple-array, usamos LIKE para buscar
      query.andWhere('task.assigneeIds LIKE :assigneeId', {
        assigneeId: `%${assigneeId}%`,
      });
    }

    if (dueDate) {
      query.andWhere('DATE(task.dueDate) = DATE(:dueDate)', { dueDate });
    }

    query.skip((page - 1) * limit).take(limit);
    query.orderBy('task.createdAt', 'DESC');

    const [items, total] = await query.getManyAndCount();

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  findOne(id: string) {
    return this.tasksRepository.findOne({ where: { id } });
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string) {
    const task = await this.tasksRepository.findOne({ where: { id } });
    if (!task) {
      throw new Error('Task not found');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException('You are not allowed to update this task');
    }

    const changes: string[] = [];

    if (updateTaskDto.status && updateTaskDto.status !== task.status) {
      changes.push('STATUS');
    }

    if (updateTaskDto.assigneeIds) {
      const oldAssignees = (task.assigneeIds || []).sort();
      const newAssignees = (updateTaskDto.assigneeIds || []).sort();

      const isDifferent =
        JSON.stringify(oldAssignees) !== JSON.stringify(newAssignees);
      if (isDifferent) {
        changes.push('ASSIGNEES');
      }
    }

    Object.assign(task, updateTaskDto);

    const updatedTask = await this.tasksRepository.save(task);
    this.client.emit('task_updated', { ...updatedTask, changes });

    return updatedTask;
  }

  async remove(id: string, userId: string) {
    const task = await this.tasksRepository.findOne({ where: { id } });
    if (!task) {
      throw new Error('Task not found');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException('You are not allowed to delete this task');
    }

    return this.tasksRepository.delete(id);
  }
}

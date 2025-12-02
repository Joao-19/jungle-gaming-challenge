import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreateTaskDto,
  UpdateTaskDto,
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

    // Injeta o cliente RabbitMQ que configuramos no módulo
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

  findAll() {
    return this.tasksRepository.find();
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

    // Atualiza os campos
    Object.assign(task, updateTaskDto);

    const updatedTask = await this.tasksRepository.save(task);

    // Emite evento de atualização
    this.client.emit('task_updated', updatedTask);

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

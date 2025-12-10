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
import { TaskHistory } from './entities/task-history.entity';
import { TaskAssignee } from './entities/task-assignee.entity';
import { TaskComment } from './entities/task-comment.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,

    @InjectRepository(TaskHistory)
    private historyRepository: Repository<TaskHistory>,

    @InjectRepository(TaskComment)
    private commentsRepository: Repository<TaskComment>,

    @InjectRepository(TaskAssignee)
    private assigneesRepository: Repository<TaskAssignee>,

    @Inject('NOTIFICATIONS_SERVICE') private readonly client: ClientProxy,
  ) {}

  async addComment(taskId: string, userId: string, content: string) {
    const task = await this.tasksRepository.findOne({
      where: { id: taskId },
      relations: ['assignees'],
    });
    if (!task) {
      throw new Error('Task not found');
    }

    const comment = this.commentsRepository.create({
      taskId,
      userId,
      content,
    });
    const savedComment = await this.commentsRepository.save(comment);

    // Determine recipients: Owner + Assignees (exclude comment author)
    const recipients = [
      ...new Set([
        task.userId,
        ...(task.assignees?.map((a) => a.userId) || []),
      ]),
    ].filter(
      (id) => id !== userId, // Não notifica quem comentou
    );

    // Emit event for real-time updates with task title
    this.client.emit('comment_added', {
      comment: savedComment,
      taskTitle: task.title, // ✅ Adiciona o título da task
      taskId: task.id,
      recipients,
    });

    return savedComment;
  }

  async getComments(taskId: string, filters: GetTasksFilterDto) {
    const { page = 1, limit = 10 } = filters;

    const [items, total] = await this.commentsRepository.findAndCount({
      where: { taskId },
      order: { createdAt: 'DESC' }, // Newest first to match history
      skip: (page - 1) * limit,
      take: limit,
    });

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

  async create(createTaskDto: CreateTaskDto, userId: string) {
    const task = this.tasksRepository.create({
      ...createTaskDto,
      status: TaskStatus.TODO,
      priority: createTaskDto.priority || TaskPriority.LOW,
      userId: userId,
      assignees: (createTaskDto.assigneeIds || []).map((id) =>
        this.assigneesRepository.create({ userId: id }),
      ),
    });

    const savedTask = await this.tasksRepository.save(task);

    // Log Creation
    await this.historyRepository.save({
      taskId: savedTask.id,
      userId: userId,
      action: 'CREATED',
    });

    // Map assignees to IDs for the event payload
    const assigneeIds = savedTask.assignees?.map((a) => a.userId) || [];

    this.client.emit('task_created', {
      ...savedTask,
      assigneeIds, // ✅ Agora explícito para o Notifications Service
      actorId: userId,
    });

    return savedTask;
  }

  async findAll(filters: GetTasksFilterDto, userId: string) {
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

    // Filter by Owner OR Assignee
    query.leftJoinAndSelect('task.assignees', 'assignees');

    query.andWhere('(task.userId = :userId OR assignees.userId = :userId)', {
      userId,
    });

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

    // Map back using a strategy that keeps compatibility if needed,
    // but typically we just return the entities.
    // For compatibility with DTO that expects assigneeIds string assignment:
    const mappedItems = items.map((item) => ({
      ...item,
      assigneeIds: item.assignees?.map((a) => a.userId) || [],
    }));

    return {
      data: mappedItems,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['assignees'],
    });

    if (!task) return null;

    return {
      ...task,
      assigneeIds: task.assignees?.map((a) => a.userId) || [],
    };
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string) {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['assignees'],
    });
    if (!task) {
      throw new Error('Task not found');
    }

    // Allow Owner OR Assignee to update
    const isOwner = task.userId === userId;
    const isAssignee = task.assignees?.some((a) => a.userId === userId);

    if (!isOwner && !isAssignee) {
      throw new ForbiddenException('You are not allowed to update this task');
    }

    const changes: string[] = [];

    // Detect and Log Status Change
    if (updateTaskDto.status && updateTaskDto.status !== task.status) {
      changes.push('STATUS');
      await this.historyRepository.save({
        taskId: task.id,
        userId: userId,
        action: 'UPDATED',
        field: 'STATUS',
        oldValue: task.status,
        newValue: updateTaskDto.status,
      });
    }

    // Detect and Log Priority Change
    if (updateTaskDto.priority && updateTaskDto.priority !== task.priority) {
      await this.historyRepository.save({
        taskId: task.id,
        userId: userId,
        action: 'UPDATED',
        field: 'PRIORITY',
        oldValue: task.priority,
        newValue: updateTaskDto.priority,
      });
    }

    // Detect and Log Title Change
    if (updateTaskDto.title && updateTaskDto.title !== task.title) {
      await this.historyRepository.save({
        taskId: task.id,
        userId: userId,
        action: 'UPDATED',
        field: 'TITLE',
        oldValue: task.title,
        newValue: updateTaskDto.title,
      });
    }

    // Detect and Log Description Change
    if (
      updateTaskDto.description !== undefined &&
      updateTaskDto.description !== task.description
    ) {
      await this.historyRepository.save({
        taskId: task.id,
        userId: userId,
        action: 'UPDATED',
        field: 'DESCRIPTION',
        oldValue: task.description ? 'Texto anterior' : 'Vazio',
        newValue: updateTaskDto.description ? 'Novo texto' : 'Vazio',
      });
    }

    // Detect and Log Assignees Change
    if (updateTaskDto.assigneeIds) {
      const oldAssignees = (task.assignees?.map((a) => a.userId) || []).sort();
      const newAssignees = (updateTaskDto.assigneeIds || []).sort();

      const isDifferent =
        JSON.stringify(oldAssignees) !== JSON.stringify(newAssignees);

      if (isDifferent) {
        changes.push('ASSIGNEES');
        await this.historyRepository.save({
          taskId: task.id,
          userId: userId,
          action: 'UPDATED',
          field: 'ASSIGNEES',
          oldValue: JSON.stringify(oldAssignees),
          newValue: JSON.stringify(newAssignees),
        });

        // Update relation
        // Clear current assignees
        await this.assigneesRepository.delete({ taskId: task.id });

        // Add new assignees
        const newAssigneeEntities = updateTaskDto.assigneeIds.map((id) =>
          this.assigneesRepository.create({ userId: id, taskId: task.id }),
        );
        await this.assigneesRepository.save(newAssigneeEntities);

        // Reload task to get updated assignees for response
        const reloadedTask = await this.tasksRepository.findOne({
          where: { id: task.id },
          relations: ['assignees'],
        });
        task.assignees = reloadedTask?.assignees || [];
      }
    }

    // Save simple properties
    const { assigneeIds, ...simpleUpdate } = updateTaskDto; // Exclude assigneeIds from direct update
    Object.assign(task, simpleUpdate);

    const updatedTask = await this.tasksRepository.save(task);

    const responseTask = {
      ...updatedTask,
      assigneeIds: updatedTask.assignees?.map((a) => a.userId) || [],
    };

    this.client.emit('task_updated', {
      ...responseTask,
      changes,
      actorId: userId,
    });

    return responseTask;
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

  async getHistory(taskId: string, filters: GetTasksFilterDto) {
    const { page = 1, limit = 5 } = filters;

    const [items, total] = await this.historyRepository.findAndCount({
      where: { taskId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

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
}

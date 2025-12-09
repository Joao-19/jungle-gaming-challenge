import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { TaskHistory } from './entities/task-history.entity';
import { TaskAssignee } from './entities/task-assignee.entity';
import { TaskComment } from './entities/task-comment.entity';
import { ClientProxy } from '@nestjs/microservices';
import { ForbiddenException } from '@nestjs/common';
import { TaskStatus, TaskPriority } from '@repo/dtos';

const mockClientProxy = {
  emit: jest.fn(),
};

describe('TasksService', () => {
  let service: TasksService;
  let tasksRepo: Repository<Task>;
  let historyRepo: Repository<TaskHistory>;
  let commentsRepo: Repository<TaskComment>;
  let assigneesRepo: Repository<TaskAssignee>;

  const mockTask = {
    id: 'task-uuid-123',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    userId: 'user-uuid-123',
    dueDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    assignees: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TaskHistory),
          useValue: {
            save: jest.fn(),
            findAndCount: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TaskComment),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findAndCount: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TaskAssignee),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: 'NOTIFICATIONS_SERVICE',
          useValue: mockClientProxy,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    tasksRepo = module.get<Repository<Task>>(getRepositoryToken(Task));
    historyRepo = module.get<Repository<TaskHistory>>(
      getRepositoryToken(TaskHistory),
    );
    commentsRepo = module.get<Repository<TaskComment>>(
      getRepositoryToken(TaskComment),
    );
    assigneesRepo = module.get<Repository<TaskAssignee>>(
      getRepositoryToken(TaskAssignee),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create a task', () => {
    it('should create a task successfully', async () => {
      // Arrange
      const createTaskDto = {
        title: 'New Task',
        description: 'Task description',
        priority: TaskPriority.HIGH,
        assigneeIds: ['user-2'],
      };
      const userId = 'user-uuid-123';

      const assigneeMock = { userId: 'user-2' };
      jest.spyOn(assigneesRepo, 'create').mockReturnValue(assigneeMock as any);
      jest
        .spyOn(tasksRepo, 'create')
        .mockReturnValue({ ...mockTask, ...createTaskDto } as any);
      jest
        .spyOn(tasksRepo, 'save')
        .mockResolvedValue({ ...mockTask, ...createTaskDto } as any);
      jest.spyOn(historyRepo, 'save').mockResolvedValue({} as any);

      // Act
      const result = await service.create(createTaskDto, userId);

      // Assert
      expect(tasksRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: createTaskDto.title,
          description: createTaskDto.description,
          status: TaskStatus.TODO,
          priority: createTaskDto.priority,
          userId,
        }),
      );
      expect(tasksRepo.save).toHaveBeenCalled();
      expect(historyRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: expect.any(String),
          userId,
          action: 'CREATED',
        }),
      );
      expect(mockClientProxy.emit).toHaveBeenCalledWith(
        'task_created',
        expect.objectContaining({ actorId: userId }),
      );
    });

    it('should create task with default priority LOW if not specified', async () => {
      // Arrange
      const createTaskDto = {
        title: 'New Task',
        description: 'Task description',
      };
      const userId = 'user-uuid-123';

      jest
        .spyOn(tasksRepo, 'create')
        .mockReturnValue({ ...mockTask, priority: TaskPriority.LOW } as any);
      jest
        .spyOn(tasksRepo, 'save')
        .mockResolvedValue({ ...mockTask, priority: TaskPriority.LOW } as any);
      jest.spyOn(historyRepo, 'save').mockResolvedValue({} as any);

      // Act
      await service.create(createTaskDto, userId);

      // Assert
      expect(tasksRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: TaskPriority.LOW,
        }),
      );
    });
  });

  describe('findAll tasks', () => {
    it('should return paginated tasks', async () => {
      // Arrange
      const filters = { page: 1, limit: 10 };
      const userId = 'user-uuid-123';

      const mockTasks = [mockTask, { ...mockTask, id: 'task-uuid-456' }];
      const total = 2;

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockTasks, total]),
      };

      jest
        .spyOn(tasksRepo, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      // Act
      const result = await service.findAll(filters, userId);

      // Assert
      expect(result).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({ id: 'task-uuid-123' }),
        ]),
        meta: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
      expect(queryBuilder.skip).toHaveBeenCalledWith(0); // (page-1) * limit
      expect(queryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should filter by status when provided', async () => {
      // Arrange
      const filters = { status: TaskStatus.IN_PROGRESS, page: 1, limit: 10 };
      const userId = 'user-uuid-123';

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      jest
        .spyOn(tasksRepo, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      // Act
      await service.findAll(filters, userId);

      // Assert
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'task.status = :status',
        { status: TaskStatus.IN_PROGRESS },
      );
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      // Arrange
      const taskId = 'task-uuid-123';
      jest.spyOn(tasksRepo, 'findOne').mockResolvedValue(mockTask as any);

      // Act
      const result = await service.findOne(taskId);

      // Assert
      expect(result).toEqual(expect.objectContaining({ id: taskId }));
      expect(tasksRepo.findOne).toHaveBeenCalledWith({
        where: { id: taskId },
        relations: ['assignees'],
      });
    });

    it('should return null when task not found', async () => {
      // Arrange
      const taskId = 'non-existent-id';
      jest.spyOn(tasksRepo, 'findOne').mockResolvedValue(null);

      // Act
      const result = await service.findOne(taskId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('update a task', () => {
    it('should update task when user is owner', async () => {
      // Arrange
      const taskId = 'task-uuid-123';
      const userId = 'user-uuid-123'; // Same as task owner
      const updateDto = {
        title: 'Updated Title',
        status: TaskStatus.IN_PROGRESS,
      };

      jest.spyOn(tasksRepo, 'findOne').mockResolvedValue(mockTask as any);
      jest
        .spyOn(tasksRepo, 'save')
        .mockResolvedValue({ ...mockTask, ...updateDto } as any);
      jest.spyOn(historyRepo, 'save').mockResolvedValue({} as any);

      // Act
      const result = await service.update(taskId, updateDto, userId);

      // Assert
      expect(result).toEqual(
        expect.objectContaining({ title: 'Updated Title' }),
      );
      expect(mockClientProxy.emit).toHaveBeenCalledWith(
        'task_updated',
        expect.objectContaining({ actorId: userId }),
      );
    });

    it('should log status change in history', async () => {
      // Arrange
      const taskId = 'task-uuid-123';
      const userId = 'user-uuid-123';
      const updateDto = { status: TaskStatus.DONE };

      jest.spyOn(tasksRepo, 'findOne').mockResolvedValue(mockTask as any);
      jest
        .spyOn(tasksRepo, 'save')
        .mockResolvedValue({ ...mockTask, status: TaskStatus.DONE } as any);
      jest.spyOn(historyRepo, 'save').mockResolvedValue({} as any);

      // Act
      await service.update(taskId, updateDto, userId);

      // Assert
      expect(historyRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId,
          userId,
          action: 'UPDATED',
          field: 'STATUS',
          oldValue: TaskStatus.IN_PROGRESS,
          newValue: TaskStatus.DONE,
        }),
      );
    });

    it('should throw ForbiddenException when user is not owner or assignee', async () => {
      // Arrange
      const taskId = 'task-uuid-123';
      const userId = 'different-user-id'; // Different from owner
      const updateDto = { title: 'Hacked Title' };

      const taskWithNoAssignees = { ...mockTask, assignees: [] };
      jest
        .spyOn(tasksRepo, 'findOne')
        .mockResolvedValue(taskWithNoAssignees as any);

      // Act & Assert
      await expect(service.update(taskId, updateDto, userId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.update(taskId, updateDto, userId)).rejects.toThrow(
        'You are not allowed to update this task',
      );
    });

    it('should allow assignee to update task', async () => {
      // Arrange
      const taskId = 'task-uuid-123';
      const userId = 'assignee-user-id';
      const updateDto = { status: TaskStatus.IN_PROGRESS };

      const taskWithAssignee = {
        ...mockTask,
        userId: 'owner-id', // Different owner
        assignees: [{ userId: 'assignee-user-id' }],
      };

      jest
        .spyOn(tasksRepo, 'findOne')
        .mockResolvedValue(taskWithAssignee as any);
      jest
        .spyOn(tasksRepo, 'save')
        .mockResolvedValue({ ...taskWithAssignee, ...updateDto } as any);
      jest.spyOn(historyRepo, 'save').mockResolvedValue({} as any);

      // Act
      const result = await service.update(taskId, updateDto, userId);

      // Assert
      expect(result).toBeDefined();
      expect(tasksRepo.save).toHaveBeenCalled();
    });
  });

  describe('remove a task', () => {
    it('should delete task when user is owner', async () => {
      // Arrange
      const taskId = 'task-uuid-123';
      const userId = 'user-uuid-123'; // Same as owner

      jest.spyOn(tasksRepo, 'findOne').mockResolvedValue(mockTask as any);
      jest.spyOn(tasksRepo, 'delete').mockResolvedValue({ affected: 1 } as any);

      // Act
      await service.remove(taskId, userId);

      // Assert
      expect(tasksRepo.delete).toHaveBeenCalledWith(taskId);
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      // Arrange
      const taskId = 'task-uuid-123';
      const userId = 'different-user-id';

      jest.spyOn(tasksRepo, 'findOne').mockResolvedValue(mockTask as any);

      // Act & Assert
      await expect(service.remove(taskId, userId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.remove(taskId, userId)).rejects.toThrow(
        'You are not allowed to delete this task',
      );
    });

    it('should throw error when task not found', async () => {
      // Arrange
      const taskId = 'non-existent-id';
      const userId = 'user-uuid-123';

      jest.spyOn(tasksRepo, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(taskId, userId)).rejects.toThrow(
        'Task not found',
      );
    });
  });

  describe('addComment to a task', () => {
    it('should add comment to task', async () => {
      // Arrange
      const taskId = 'task-uuid-123';
      const userId = 'user-uuid-123';
      const content = 'This is a comment';

      const mockComment = {
        id: 'comment-1',
        taskId,
        userId,
        content,
        createdAt: new Date(),
      };

      jest.spyOn(tasksRepo, 'findOne').mockResolvedValue(mockTask as any);
      jest.spyOn(commentsRepo, 'create').mockReturnValue(mockComment as any);
      jest.spyOn(commentsRepo, 'save').mockResolvedValue(mockComment as any);

      // Act
      const result = await service.addComment(taskId, userId, content);

      // Assert
      expect(result).toEqual(mockComment);
      expect(commentsRepo.create).toHaveBeenCalledWith({
        taskId,
        userId,
        content,
      });
      expect(mockClientProxy.emit).toHaveBeenCalledWith(
        'comment_added',
        expect.objectContaining({
          comment: mockComment,
          taskTitle: mockTask.title,
          taskId: mockTask.id,
        }),
      );
    });

    it('should not notify comment author', async () => {
      // Arrange
      const taskId = 'task-uuid-123';
      const userId = 'user-uuid-123'; // Same as task owner
      const content = 'Self comment';

      const mockComment = {
        id: 'comment-1',
        taskId,
        userId,
        content,
        createdAt: new Date(),
      };

      jest.spyOn(tasksRepo, 'findOne').mockResolvedValue(mockTask as any);
      jest.spyOn(commentsRepo, 'create').mockReturnValue(mockComment as any);
      jest.spyOn(commentsRepo, 'save').mockResolvedValue(mockComment as any);

      // Act
      await service.addComment(taskId, userId, content);

      // Assert
      const emitCall = mockClientProxy.emit.mock.calls[0];
      const recipients = emitCall[1].recipients;
      expect(recipients).not.toContain(userId); // Author not in recipients
    });
  });

  describe('getComments from a task', () => {
    it('should return paginated comments', async () => {
      // Arrange
      const taskId = 'task-uuid-123';
      const filters = { page: 1, limit: 10 };

      const mockComments = [
        { id: 'comment-1', taskId, userId: 'user-1', content: 'Comment 1' },
        { id: 'comment-2', taskId, userId: 'user-2', content: 'Comment 2' },
      ];

      jest
        .spyOn(commentsRepo, 'findAndCount')
        .mockResolvedValue([mockComments, 2] as any);

      // Act
      const result = await service.getComments(taskId, filters);

      // Assert
      expect(result).toEqual({
        data: mockComments,
        meta: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
      expect(commentsRepo.findAndCount).toHaveBeenCalledWith({
        where: { taskId },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('getHistory', () => {
    it('should return paginated history', async () => {
      // Arrange
      const taskId = 'task-uuid-123';
      const filters = { page: 1, limit: 5 };

      const mockHistory = [
        { id: 'history-1', taskId, action: 'CREATED' },
        { id: 'history-2', taskId, action: 'UPDATED', field: 'STATUS' },
      ];

      jest
        .spyOn(historyRepo, 'findAndCount')
        .mockResolvedValue([mockHistory, 2] as any);

      // Act
      const result = await service.getHistory(taskId, filters);

      // Assert
      expect(result).toEqual({
        data: mockHistory,
        meta: {
          total: 2,
          page: 1,
          limit: 5,
          totalPages: 1,
        },
      });
    });
  });
});

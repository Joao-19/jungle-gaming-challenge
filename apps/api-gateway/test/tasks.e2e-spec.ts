import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TasksController } from '../src/tasks/tasks.controller';
import { TasksService } from '../src/tasks/tasks.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../src/auth/jwt.strategy';

/**
 * E2E Tests for Tasks CRUD Endpoints
 *
 * TRADE-OFFS (Opção B - Mocks):
 *
 * ✅ VANTAGENS:
 * - Testes rápidos e isolados
 * - Não depende de tasks-service rodando
 * - Fácil de testar cenários edge-case
 *
 * ⚠️ LIMITAÇÕES:
 * - Não testa comunicação real HTTP com tasks-service
 * - Não valida autorizações no serviço real
 * - Paginação e filtros não são testados end-to-end
 */

describe('Tasks E2E (Mocked)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const mockTasksService = {
    createTask: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getHistory: jest.fn(),
    addComment: jest.fn(),
    getComments: jest.fn(),
  };

  // Generate a valid JWT for authenticated requests
  const generateToken = (userId: string = 'test-user-id') => {
    return jwtService.sign({ sub: userId, email: 'test@example.com' });
  };

  // Mock JwtStrategy for testing - must extend PassportStrategy properly
  const testJwtStrategy = {
    provide: 'JwtStrategy',
    useFactory: () => ({
      validate: (payload: any) => ({
        userId: payload.sub,
        email: payload.email,
      }),
    }),
  };

  beforeAll(async () => {
    const testSecret = 'test-secret-key-for-e2e-tests';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({ JWT_SECRET: testSecret })],
        }),
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: testSecret,
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
        JwtStrategy,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /tasks', () => {
    const createTaskDto = {
      title: 'Nova Tarefa',
      description: 'Descrição da tarefa',
      priority: 'HIGH',
      status: 'TODO',
    };

    it('deve criar tarefa quando autenticado', async () => {
      const expectedTask = {
        id: '123',
        ...createTaskDto,
        ownerId: 'test-user-id',
      };
      mockTasksService.createTask.mockResolvedValue(expectedTask);

      const token = generateToken();

      const response = await request
        .default(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send(createTaskDto)
        .expect(201);

      expect(response.body).toEqual(expectedTask);
      expect(mockTasksService.createTask).toHaveBeenCalled();
    });

    it('deve retornar 401 sem autenticação', async () => {
      await request
        .default(app.getHttpServer())
        .post('/tasks')
        .send(createTaskDto)
        .expect(401);
    });
  });

  describe('GET /tasks', () => {
    it('deve listar tarefas com paginação', async () => {
      const mockResponse = {
        data: [
          { id: '1', title: 'Tarefa 1' },
          { id: '2', title: 'Tarefa 2' },
        ],
        total: 2,
        page: 1,
        limit: 10,
      };
      mockTasksService.findAll.mockResolvedValue(mockResponse);

      const token = generateToken();

      const response = await request
        .default(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(mockTasksService.findAll).toHaveBeenCalled();
    });

    it('deve retornar 401 sem autenticação', async () => {
      await request.default(app.getHttpServer()).get('/tasks').expect(401);
    });
  });

  describe('GET /tasks/:id', () => {
    it('deve retornar tarefa específica', async () => {
      const mockTask = { id: '123', title: 'Tarefa Teste', status: 'TODO' };
      mockTasksService.findOne.mockResolvedValue(mockTask);

      const token = generateToken();

      const response = await request
        .default(app.getHttpServer())
        .get('/tasks/123')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.id).toBe('123');
    });
  });

  describe('PATCH /tasks/:id', () => {
    it('deve atualizar tarefa', async () => {
      const updateDto = { status: 'IN_PROGRESS' };
      const mockUpdated = { id: '123', title: 'Tarefa', status: 'IN_PROGRESS' };
      mockTasksService.update.mockResolvedValue(mockUpdated);

      const token = generateToken();

      const response = await request
        .default(app.getHttpServer())
        .patch('/tasks/123')
        .set('Authorization', `Bearer ${token}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.status).toBe('IN_PROGRESS');
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('deve deletar tarefa', async () => {
      mockTasksService.remove.mockResolvedValue({ affected: 1 });

      const token = generateToken();

      await request
        .default(app.getHttpServer())
        .delete('/tasks/123')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(mockTasksService.remove).toHaveBeenCalled();
    });
  });

  describe('POST /tasks/:id/comments', () => {
    it('deve adicionar comentário', async () => {
      const mockComment = {
        id: '1',
        content: 'Novo comentário',
        userId: 'test-user-id',
      };
      mockTasksService.addComment.mockResolvedValue(mockComment);

      const token = generateToken();

      const response = await request
        .default(app.getHttpServer())
        .post('/tasks/123/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Novo comentário' })
        .expect(201);

      expect(response.body.content).toBe('Novo comentário');
    });
  });

  describe('GET /tasks/:id/comments', () => {
    it('deve listar comentários', async () => {
      const mockComments = {
        data: [{ id: '1', content: 'Comentário 1' }],
        total: 1,
      };
      mockTasksService.getComments.mockResolvedValue(mockComments);

      const token = generateToken();

      const response = await request
        .default(app.getHttpServer())
        .get('/tasks/123/comments')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

/**
 * E2E Tests for Auth Endpoints
 *
 * TRADE-OFFS:
 *
 * ✅ VANTAGENS:
 * - Execução rápida (~50ms vs 5s+ com banco real)
 * - Independente de infraestrutura (não precisa docker-compose up)
 * - Testes determinísticos (sem dados residuais)
 * - Ideal para CI/CD (GitHub Actions, etc.)
 *
 * ⚠️ LIMITAÇÕES:
 * - Não testa integração real com auth-service
 * - Não valida queries SQL ou migrations
 * - Erros de comunicação HTTP não são detectados
 *
 * 📌 QUANDO USAR BANCO REAL:
 * - Testes de regressão pré-deploy
 * - Validação de migrations
 * - Debug de problemas de integração
 */

describe('Auth E2E (Mocked)', () => {
  let app: INestApplication;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]), // High limit for tests
        PassportModule,
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    const validUser = {
      email: 'test@example.com',
      password: 'Password123!',
      username: 'testuser',
    };

    it('deve criar usuário com dados válidos', async () => {
      const expectedResponse = {
        id: '123',
        email: validUser.email,
        username: validUser.username,
      };
      mockAuthService.register.mockResolvedValue(expectedResponse);

      const response = await request
        .default(app.getHttpServer())
        .post('/auth/register')
        .send(validUser)
        .expect(201);

      expect(response.body).toEqual(expectedResponse);
      expect(mockAuthService.register).toHaveBeenCalledWith(validUser);
    });

    it('deve retornar erro quando auth-service falha', async () => {
      mockAuthService.register.mockRejectedValue({
        response: { status: 409 },
        message: 'Email já cadastrado',
      });

      await request
        .default(app.getHttpServer())
        .post('/auth/register')
        .send(validUser)
        .expect(500); // HttpException wraps the error
    });
  });

  describe('POST /auth/login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('deve retornar tokens com credenciais válidas', async () => {
      const expectedResponse = {
        user: { id: '123', email: loginDto.email },
        accessToken: 'jwt-access-token',
        refreshToken: 'jwt-refresh-token',
      };
      mockAuthService.login.mockResolvedValue(expectedResponse);

      const response = await request
        .default(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(201); // POST returns 201 by default in NestJS

      expect(response.body).toEqual(expectedResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });

    it('deve retornar erro com credenciais inválidas', async () => {
      mockAuthService.login.mockRejectedValue({
        response: { status: 401 },
        message: 'Invalid credentials',
      });

      await request
        .default(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(500);
    });
  });

  describe('POST /auth/refresh', () => {
    it('deve renovar tokens com refresh token válido', async () => {
      const expectedResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };
      mockAuthService.refresh.mockResolvedValue(expectedResponse);

      const response = await request
        .default(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'valid-refresh-token' })
        .expect(201);

      expect(response.body).toEqual(expectedResponse);
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('deve enviar email de recuperação', async () => {
      mockAuthService.forgotPassword.mockResolvedValue({
        message: 'Email enviado',
      });

      const response = await request
        .default(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(201);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /auth/reset-password', () => {
    it('deve redefinir senha com token válido', async () => {
      mockAuthService.resetPassword.mockResolvedValue({
        message: 'Senha alterada com sucesso',
      });

      const response = await request
        .default(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'valid-token', newPassword: 'NewPassword123!' })
        .expect(201);

      expect(response.body.message).toBeDefined();
    });
  });
});

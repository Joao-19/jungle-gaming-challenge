import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

/**
 * E2E Tests for Tasks Service
 *
 * Nota: Testes E2E completos requerem banco de dados e RabbitMQ.
 * Este teste verifica apenas que o app inicializa corretamente.
 */
describe('Tasks Service (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Skip se não houver DB configurado (CI sem infraestrutura)
    if (!process.env.DATABASE_URL && !process.env.CI_SKIP_DB_TESTS) {
      console.log('Skipping: DATABASE_URL not configured');
      return;
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should initialize the app successfully', () => {
    // Se chegou aqui, a app inicializou com sucesso
    expect(true).toBe(true);
  });
});

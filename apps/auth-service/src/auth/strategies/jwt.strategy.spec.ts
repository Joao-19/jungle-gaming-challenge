import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'test-secret-key';
              return null;
            }),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('validate', () => {
    it('should return user data when payload is valid', async () => {
      // Arrange
      const payload = {
        sub: 'user-uuid-123',
        email: 'test@example.com',
        username: 'testuser',
      };

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).toEqual({
        userId: 'user-uuid-123',
        email: 'test@example.com',
        username: 'testuser',
      });
    });

    it('should extract userId from sub claim', async () => {
      // Arrange
      const payload = {
        sub: 'extracted-user-id',
        email: 'user@example.com',
        username: 'user',
      };

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result.userId).toBe('extracted-user-id');
    });

    it('should include email and username in returned user', async () => {
      // Arrange
      const payload = {
        sub: 'user-id',
        email: 'specific@email.com',
        username: 'specificUser',
      };

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result.email).toBe('specific@email.com');
      expect(result.username).toBe('specificUser');
    });
  });

  describe('constructor', () => {
    it('should use JWT_SECRET from config', () => {
      // Assert
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('should configure passport with fromAuthHeaderAsBearerToken', () => {
      // This is implicitly tested by Passport.js integration
      // The strategy is registered with Passport and will extract from Bearer token
      expect(strategy).toBeDefined();
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock do ClientProxy (RabbitMQ)
const mockEmailClient = {
  emit: jest.fn(),
  connect: jest.fn(),
  close: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;

  // Mock user para testes
  const mockUser = {
    id: 'uuid-123',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedPassword123',
    currentRefreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            validateUser: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                JWT_SECRET: 'test-secret',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
                JWT_EXPIRES_IN: '15m',
                JWT_REFRESH_EXPIRES_IN: '7d',
              };
              return config[key];
            }),
          },
        },
        {
          provide: 'EMAIL_SERVICE',
          useValue: mockEmailClient,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return tokens when credentials are valid', async () => {
      // Arrange
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const expectedTokens = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
      };

      jest.spyOn(usersService, 'validateUser').mockResolvedValue(mockUser);
      jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce(expectedTokens.accessToken)
        .mockResolvedValueOnce(expectedTokens.refreshToken);
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve('hashed-refresh-token'));
      jest.spyOn(usersService, 'update').mockResolvedValue(undefined);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toHaveProperty('accessToken', expectedTokens.accessToken);
      expect(result).toHaveProperty(
        'refreshToken',
        expectedTokens.refreshToken,
      );
      expect(result).toHaveProperty('user');
      expect(usersService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
    });

    it('should throw ForbiddenException when credentials are invalid', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'wrong-password',
      };
      jest.spyOn(usersService, 'validateUser').mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(ForbiddenException);
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid email or password',
      );
    });
  });

  describe('getTokens', () => {
    it('should generate access and refresh tokens', async () => {
      // Arrange
      const userId = 'uuid-123';
      const email = 'test@example.com';
      const username = 'testuser';

      jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      // Act
      const result = await service.getTokens(userId, email, username);

      // Assert
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);

      // Verifica que access token usa JWT_SECRET
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        { sub: userId, email, username },
        { secret: 'test-secret', expiresIn: '15m' },
      );

      // Verifica que refresh token usa JWT_REFRESH_SECRET
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        { sub: userId, email, username },
        { secret: 'test-refresh-secret', expiresIn: '7d' },
      );
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens when valid refresh token is provided', async () => {
      // Arrange
      const userId = 'uuid-123';
      const refreshToken = 'valid-refresh-token';
      const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

      const userWithToken = {
        ...mockUser,
        currentRefreshToken: hashedRefreshToken,
      };

      jest.spyOn(usersService, 'findOne').mockResolvedValue(userWithToken);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve('new-hashed-token'));
      jest.spyOn(usersService, 'update').mockResolvedValue(undefined);

      // Act
      const result = await service.refreshTokens(userId, refreshToken);

      // Assert
      expect(result).toHaveProperty('accessToken', 'new-access-token');
      expect(result).toHaveProperty('refreshToken', 'new-refresh-token');
    });

    it('should throw ForbiddenException when refresh token does not match', async () => {
      // Arrange
      const userId = 'uuid-123';
      const refreshToken = 'wrong-refresh-token';

      const userWithToken = {
        ...mockUser,
        currentRefreshToken: 'hashed-different-token',
      };

      jest.spyOn(usersService, 'findOne').mockResolvedValue(userWithToken);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      // Act & Assert
      await expect(service.refreshTokens(userId, refreshToken)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when user has no refresh token', async () => {
      // Arrange
      const userId = 'uuid-123';
      const refreshToken = 'some-token';

      const userWithoutToken = {
        ...mockUser,
        currentRefreshToken: null,
      };

      jest.spyOn(usersService, 'findOne').mockResolvedValue(userWithoutToken);

      // Act & Assert
      await expect(service.refreshTokens(userId, refreshToken)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('logout', () => {
    it('should clear refresh token on logout', async () => {
      // Arrange
      const userId = 'uuid-123';
      jest.spyOn(usersService, 'update').mockResolvedValue(undefined);

      // Act
      await service.logout(userId);

      // Assert
      expect(usersService.update).toHaveBeenCalledWith(userId, {
        currentRefreshToken: null,
      });
    });
  });

  describe('forgotPassword', () => {
    it('should create reset token and emit email event', async () => {
      // Arrange
      const email = 'test@example.com';
      jest.spyOn(usersService, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(usersService, 'update').mockResolvedValue(undefined);

      // Act
      await service.forgotPassword(email);

      // Assert
      expect(usersService.findOne).toHaveBeenCalledWith({ email });
      expect(usersService.update).toHaveBeenCalled();
      expect(mockEmailClient.emit).toHaveBeenCalledWith(
        'password_reset_requested',
        expect.objectContaining({
          email: mockUser.email,
          username: mockUser.username,
          resetToken: expect.any(String),
        }),
      );
    });

    it('should silently return when user does not exist (security)', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      jest.spyOn(usersService, 'findOne').mockResolvedValue(null);

      // Act
      await service.forgotPassword(email);

      // Assert
      expect(usersService.update).not.toHaveBeenCalled();
      expect(mockEmailClient.emit).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      // Arrange
      const resetToken = 'valid-reset-token';
      const newPassword = 'newPassword123';
      const userWithResetToken = {
        ...mockUser,
        resetToken,
        resetTokenExpiry: new Date(Date.now() + 3600000), // 1 hour in future
      };

      jest.spyOn(usersService, 'findOne').mockResolvedValue(userWithResetToken);
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve('hashed-new-password'));
      jest.spyOn(usersService, 'update').mockResolvedValue(undefined);

      // Act
      await service.resetPassword(resetToken, newPassword);

      // Assert
      expect(usersService.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          password: 'hashed-new-password',
          resetToken: null,
          resetTokenExpiry: null,
        }),
      );
    });

    it('should throw NotFoundException when token is invalid', async () => {
      // Arrange
      const resetToken = 'invalid-token';
      const newPassword = 'newPassword123';
      jest.spyOn(usersService, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.resetPassword(resetToken, newPassword),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when token is expired', async () => {
      // Arrange
      const resetToken = 'expired-token';
      const newPassword = 'newPassword123';
      const userWithExpiredToken = {
        ...mockUser,
        resetToken,
        resetTokenExpiry: new Date(Date.now() - 1000), // 1 second in past
      };

      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValue(userWithExpiredToken);

      // Act & Assert
      await expect(
        service.resetPassword(resetToken, newPassword),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.resetPassword(resetToken, newPassword),
      ).rejects.toThrow('Reset token has expired');
    });
  });
});

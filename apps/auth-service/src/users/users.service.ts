import * as bcrypt from 'bcrypt';
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { CreateUserDto, UserResponseDto, UserQueryDto } from '@repo/dtos';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.usersRepository.findOne({
      where: [
        { email: createUserDto.email },
        { username: createUserDto.username },
      ],
    });
    if (existingUser)
      throw new ConflictException('Email ou Username já estão em uso.');

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);
    const newUser = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const user = await this.usersRepository.save(newUser);

    return new UserResponseDto(user);
  }

  async findAll(query: UserQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<User>[] = [];
    if (search) {
      where.push({ username: Like(`%${search}%`) });
      where.push({ email: Like(`%${search}%`) });
    }

    const [users, total] = await this.usersRepository.findAndCount({
      where: where.length > 0 ? where : {},
      skip,
      take: limit,
      order: { username: 'ASC' },
    });

    return {
      data: users.map((u) => new UserResponseDto(u)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  findOne(form: { id?: string; email?: string; resetToken?: string }) {
    return this.usersRepository.findOne({ where: form });
  }

  update(id: string, updateUserDto: Partial<User>) {
    return this.usersRepository.update(id, updateUserDto);
  }

  remove(id: string) {
    return this.usersRepository.delete(id);
  }

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (user && (await bcrypt.compare(pass, user.password))) return user;
    return null;
  }
}

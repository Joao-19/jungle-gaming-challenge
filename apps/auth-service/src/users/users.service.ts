import * as bcrypt from 'bcrypt';
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // 1. Verificar se usuário já existe
    const existingUser = await this.usersRepository.findOne({
      where: [{ email: createUserDto.email }, { username: createUserDto.username }],
    });

    if (existingUser) {
      throw new ConflictException('Email ou Username já estão em uso.');
    }

    // 2. Criptografar a senha (Hash)
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    // 3. Criar o objeto e salvar
    const newUser = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword, // Salva o hash, não a senha real
    });

    return this.usersRepository.save(newUser);
  }

  // Métodos padrões do CRUD (podemos deixar simples por enquanto)
  findAll() {
    return this.usersRepository.find();
  }

  findOne(id: string) { // Mudamos para string pois usamos UUID
    return this.usersRepository.findOneBy({ id });
  }
  
  // O desafio não pede update/remove de usuário especificamente, mas mantemos o padrão
  update(id: string, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: string) {
    return `This action removes a #${id} user`;
  }

  async validateUser(email: string, pass: string): Promise<User | null> {
  // Busca o usuário pelo email
  const user = await this.usersRepository.findOne({ where: { email } });
  
  // Se achou o usuário E a senha bate (bcrypt.compare)
  if (user && await bcrypt.compare(pass, user.password)) {
    // Retorna o usuário
    return user; 
  }
  return null;
}
}
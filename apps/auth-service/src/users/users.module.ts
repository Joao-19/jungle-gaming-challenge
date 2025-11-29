import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Importe isso
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity'; // Importe sua Entidade

@Module({
  imports: [
    TypeOrmModule.forFeature([User]) // <--- A LINHA MÁGICA QUE FALTA
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Exporte o Service se for usar no AuthModule depois
})
export class UsersModule {}
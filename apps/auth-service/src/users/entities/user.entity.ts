import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' }) // Define o nome da tabela no banco
export class User {
  @PrimaryGeneratedColumn('uuid') // ID único universal (melhor que números sequenciais)
  id: string;

  @Column({ nullable: true })
  currentRefreshToken: string;

  @Column({ nullable: true })
  resetToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  resetTokenExpiry?: Date;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // Aqui guardaremos o Hash, nunca a senha pura

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

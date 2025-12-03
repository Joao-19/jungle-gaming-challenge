import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Task } from './task.entity';

@Entity()
export class TaskHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  taskId: string;

  @ManyToOne(() => Task, (task) => task.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Column()
  userId: string;

  @Column()
  action: string; // 'CREATED', 'UPDATED'

  @Column({ nullable: true })
  field?: string; // e.g., 'STATUS', 'PRIORITY'

  @Column({ nullable: true })
  oldValue?: string;

  @Column({ nullable: true })
  newValue?: string;

  @CreateDateColumn()
  createdAt: Date;
}

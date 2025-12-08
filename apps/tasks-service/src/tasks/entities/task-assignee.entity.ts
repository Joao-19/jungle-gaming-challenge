import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Task } from './task.entity';

@Entity({ name: 'task_assignees' })
export class TaskAssignee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  taskId: string;

  @Column()
  @Index() // Index for fast lookups by userId
  userId: string;

  @CreateDateColumn()
  assignedAt: Date;

  @ManyToOne(() => Task, (task) => task.assignees, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task: Task;
}

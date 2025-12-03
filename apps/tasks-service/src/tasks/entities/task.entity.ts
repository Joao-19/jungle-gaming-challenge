import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { TaskStatus, TaskPriority } from '@repo/dtos';
import { TaskHistory } from './task-history.entity';
import { TaskComment } from './task-comment.entity';

@Entity({ name: 'tasks' })
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.TODO })
  status: TaskStatus;

  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.LOW })
  priority: TaskPriority;

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column()
  userId: string;

  @Column({ type: 'simple-array', nullable: true })
  assigneeIds: string[];

  @OneToMany(() => TaskHistory, (history) => history.task)
  history: TaskHistory[];

  @OneToMany(() => TaskComment, (comment) => comment.task)
  comments: TaskComment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

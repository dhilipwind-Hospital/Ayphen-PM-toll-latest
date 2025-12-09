import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('test_cycles')
export class TestCycle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ nullable: true })
  projectId: string;

  @Column({ nullable: true })
  sprintId: string;

  @Column({ length: 100, nullable: true })
  releaseVersion: string;

  @Column({ type: 'datetime', nullable: true })
  startDate: Date;

  @Column({ type: 'datetime', nullable: true })
  endDate: Date;

  @Column({ length: 20, default: 'planned' })
  status: string; // planned, in-progress, completed, cancelled

  @Column('simple-array', { nullable: true })
  suiteIds: string[];

  @Column('simple-array', { nullable: true })
  assignedTo: string[]; // User IDs

  @Column({ default: 0 })
  totalTests: number;

  @Column({ default: 0 })
  executedTests: number;

  @Column({ default: 0 })
  passedTests: number;

  @Column({ default: 0 })
  failedTests: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progress: number; // 0-100

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

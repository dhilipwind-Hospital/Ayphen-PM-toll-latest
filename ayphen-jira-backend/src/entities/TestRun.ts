import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { AITestSuite } from './AITestSuite';

@Entity('test_runs')
export class TestRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ nullable: true })
  suiteId: string;

  @ManyToOne(() => AITestSuite, { nullable: true })
  @JoinColumn({ name: 'suiteId' })
  suite: AITestSuite;

  @Column({ nullable: true })
  cycleId: string;

  @Column({ length: 50, default: 'dev' })
  environment: string; // dev, staging, prod

  @Column({ length: 50, default: 'chrome' })
  browser: string; // chrome, firefox, safari, edge

  @Column({ length: 20, default: 'running' })
  status: string; // running, completed, aborted

  @Column({ type: 'datetime', nullable: true })
  startTime: Date;

  @Column({ type: 'datetime', nullable: true })
  endTime: Date;

  @Column({ nullable: true })
  executedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'executedBy' })
  executor: User;

  @Column({ default: 0 })
  totalTests: number;

  @Column({ default: 0 })
  passed: number;

  @Column({ default: 0 })
  failed: number;

  @Column({ default: 0 })
  skipped: number;

  @Column({ default: 0 })
  blocked: number;

  @Column({ type: 'int', nullable: true })
  duration: number; // milliseconds

  @Column({ nullable: true })
  projectId: string;

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

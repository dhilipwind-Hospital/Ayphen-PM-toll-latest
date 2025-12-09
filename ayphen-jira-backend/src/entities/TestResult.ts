import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TestRun } from './TestRun';
import { AITestCase } from './AITestCase';
import { User } from './User';

@Entity('test_results')
export class TestResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  testRunId: string;

  @ManyToOne(() => TestRun)
  @JoinColumn({ name: 'testRunId' })
  testRun: TestRun;

  @Column()
  testCaseId: string;

  @ManyToOne(() => AITestCase)
  @JoinColumn({ name: 'testCaseId' })
  testCase: AITestCase;

  @Column({ length: 20 })
  status: string; // passed, failed, skipped, blocked

  @Column({ type: 'int', nullable: true })
  executionTime: number; // milliseconds

  @Column({ type: 'timestamp', nullable: true })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ nullable: true })
  executedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'executedBy' })
  executor: User;

  @Column({ length: 50, nullable: true })
  environment: string;

  @Column({ length: 50, nullable: true })
  browser: string;

  @Column('simple-array', { nullable: true })
  screenshots: string[]; // URLs or file paths

  @Column('text', { nullable: true })
  logs: string;

  @Column('text', { nullable: true })
  errorMessage: string;

  @Column('text', { nullable: true })
  stackTrace: string;

  @Column({ nullable: true })
  videoUrl: string;

  @Column({ nullable: true })
  defectId: string; // Linked Jira issue ID

  @Column('text', { nullable: true })
  actualResult: string;

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
}

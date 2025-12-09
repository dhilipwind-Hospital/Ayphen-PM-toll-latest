import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AIRequirement } from './AIRequirement';

@Entity('ai_test_suites')
export class AITestSuite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true, length: 50 })
  suiteKey: string; // JIRA-style key: TS-SMOKE-PROJ100

  @Column({ nullable: true })
  projectId: string;

  @Column({ length: 200 })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ length: 50 })
  category: string;

  @Column('simple-array', { default: '' })
  testCaseKeys: string[]; // Array of test case keys: ['TC-PROJ100-001', 'TC-PROJ100-002']

  @ManyToOne(() => AIRequirement)
  @JoinColumn({ name: 'requirementId' })
  requirement: AIRequirement;

  @Column()
  requirementId: string;

  @Column({ default: 0 })
  testCaseCount: number;

  @CreateDateColumn()
  createdAt: Date;
}

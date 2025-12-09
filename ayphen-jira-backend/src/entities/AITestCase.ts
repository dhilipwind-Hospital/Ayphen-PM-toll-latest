import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AIStory } from './AIStory';
import { Issue } from './Issue';

@Entity('ai_test_cases')
export class AITestCase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true, length: 50 })
  testCaseKey: string; // JIRA-style key: TC-PROJ100-001

  @Column({ nullable: true })
  requirementId: string; // Link to epic

  @Column({ nullable: true })
  projectId: string;

  @Column({ nullable: true, length: 50 })
  suiteKey: string; // Link to test suite: TS-SMOKE-PROJ100

  @ManyToOne(() => AIStory, { nullable: true })
  @JoinColumn({ name: 'storyId' })
  story: AIStory;

  @Column({ nullable: true })
  storyId: string;

  @ManyToOne(() => Issue, { nullable: true })
  @JoinColumn({ name: 'issueId' })
  issue: Issue;

  @Column({ nullable: true })
  issueId: string;

  @Column({ length: 500 })
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ length: 50 })
  type: string; // 'ui' or 'api'

  @Column({ length: 20, nullable: true })
  priority: string; // 'critical', 'high', 'medium', 'low'

  @Column({ default: false })
  automated: boolean;

  @Column('simple-array', { nullable: true })
  steps: string[];

  @Column('text', { nullable: true })
  expectedResult: string;

  @Column('simple-array', { nullable: true })
  categories: string[]; // ['smoke', 'regression', 'sanity']

  @Column({ nullable: true })
  suiteId: string;

  @Column({ default: 'active', length: 50 })
  status: string;

  @Column({ default: false })
  flagged: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

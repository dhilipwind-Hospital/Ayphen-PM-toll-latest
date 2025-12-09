import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AIRequirement } from './AIRequirement';

@Entity('ai_stories')
export class AIStory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true, length: 50 })
  storyKey: string; // JIRA-style key: PROJ-101

  @Column({ nullable: true })
  projectId: string;

  @Column({ nullable: true })
  jiraIssueId: string; // Link to external Jira

  @Column({ nullable: true })
  issueId: string; // Link to local Issue table

  @Column({ nullable: true, length: 50 })
  epicKey: string; // Link to parent epic: PROJ-100

  @ManyToOne(() => AIRequirement)
  @JoinColumn({ name: 'requirementId' })
  requirement: AIRequirement;

  @Column()
  requirementId: string;

  @Column({ length: 500 })
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ length: 20 })
  type: string; // 'ui' or 'api'

  @Column('simple-array', { nullable: true })
  acceptanceCriteria: string[];

  @Column({ default: 'generated', length: 50 })
  status: string;

  @Column({ default: 'synced', length: 50 })
  syncStatus: string;

  @Column({ default: 1 })
  version: number;

  @Column({ default: false })
  flagged: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

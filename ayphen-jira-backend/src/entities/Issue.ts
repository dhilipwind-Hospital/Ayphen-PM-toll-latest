import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Project } from './Project';

@Entity('issues')
export class Issue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

  @Column()
  summary: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  type: string; // epic, story, task, bug, subtask

  @Column()
  status: string; // todo, in-progress, in-review, done, backlog

  @Column()
  priority: string; // highest, high, medium, low, lowest

  @Column({ type: 'float', default: 0 })
  listPosition: number;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  projectId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporterId' })
  reporter: User;

  @Column()
  reporterId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigneeId' })
  assignee: User;

  @Column({ nullable: true })
  assigneeId: string;

  @Column({ type: 'simple-array', default: '' })
  labels: string[];

  @Column({ type: 'simple-array', default: '' })
  components: string[];

  @Column({ type: 'simple-array', default: '' })
  fixVersions: string[];

  @Column({ nullable: true })
  epicId: string;

  @Column({ nullable: true })
  epicLink: string | null;

  @Column({ nullable: true })
  epicKey: string | null; // JIRA-style epic key: PROJ-100

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date; // For epics: roadmap start date

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date; // For epics: roadmap end date

  @Column({ type: 'simple-json', nullable: true })
  dependencies: string[]; // Epic dependencies: array of epic IDs

  @Column({ nullable: true })
  aiStoryId: string; // Link to AI-generated story

  @Column({ nullable: true })
  sprintId: string;

  @Column({ type: 'int', nullable: true })
  storyPoints: number;

  @Column({ nullable: true })
  originalEstimate: string;

  @Column({ nullable: true })
  remainingEstimate: string;

  @Column({ nullable: true })
  timeSpent: string;

  @Column({ nullable: true })
  timeEstimate: string;

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ nullable: true })
  parentId: string;

  @Column({ nullable: true })
  subtaskCount: number;

  @Column({ default: false })
  archived: boolean;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt: Date | null;

  @Column({ nullable: true })
  archivedById: string | null;

  @Column({ nullable: true })
  updatedBy: string; // User ID who last updated

  @Column({ type: 'simple-json', nullable: true })
  workLogs: any[];

  @Column({ default: false })
  isFlagged: boolean;

  @Column({ type: 'timestamp', nullable: true })
  flaggedAt: Date | null;

  @Column({ nullable: true })
  flaggedBy: string | null;

  @Column({ type: 'simple-json', nullable: true })
  creationMetadata: {
    method: 'ai' | 'template' | 'manual';
    templateId?: string;
    aiPrompt?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('ai_requirements')
export class AIRequirement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true, length: 50 })
  epicKey: string; // JIRA-style key: PROJ-100

  @Column({ nullable: true })
  projectId: string;

  @Column({ nullable: true })
  jiraIssueId: string; // Link to Jira Issue table

  @Column({ length: 500 })
  title: string;

  @Column('text')
  content: string;

  @Column({ nullable: true, length: 500 })
  fileUrl: string;

  @Column({ default: 'draft', length: 50 })
  status: string;

  @Column({ default: 1 })
  version: number;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

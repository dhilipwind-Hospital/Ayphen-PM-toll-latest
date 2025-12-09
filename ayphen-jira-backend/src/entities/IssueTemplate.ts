import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from './Project';
import { User } from './User';

@Entity('issue_templates')
export class IssueTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  type: string; // 'bug', 'story', 'task', 'epic'

  @Column('simple-json')
  defaultFields: {
    summary?: string;
    description?: string;
    priority?: string;
    labels?: string[];
    storyPoints?: number;
    assigneeId?: string;
    epicLink?: string;
    components?: string[];
    [key: string]: any;
  };

  @Column({ nullable: true })
  projectId: string;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ default: false })
  isGlobal: boolean;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

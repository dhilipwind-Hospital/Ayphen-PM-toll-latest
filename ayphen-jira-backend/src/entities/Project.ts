import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './User';
import { ProjectMember } from './ProjectMember';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'scrum' })
  type: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'leadId' })
  lead: User;

  @Column()
  leadId: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  category: string;

  @Column({ default: false })
  isStarred: boolean;

  @Column({ nullable: true, default: 'workflow-1' })
  workflowId: string;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ nullable: true })
  archivedAt: Date | null;

  @Column({ nullable: true })
  archivedBy: string | null;

  @Column({ type: 'simple-json', nullable: true })
  projectPermissions: any;

  @Column({ default: 'private' })
  visibility: string; // 'public' or 'private'

  @Column({ default: false })
  allowPublicJoin: boolean;

  @Column({ type: 'simple-json', nullable: true })
  memberRoles: any[];

  @Column({ type: 'int', default: 0 })
  lastIssueNumber: number; // Tracks the highest issue number ever used for sequential keys

  @OneToMany(() => ProjectMember, member => member.project)
  members: ProjectMember[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

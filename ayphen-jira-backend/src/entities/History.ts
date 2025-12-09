import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Issue } from './Issue';
import { User } from './User';

@Entity('history')
export class History {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  issueId: string;

  @ManyToOne(() => Issue, { nullable: true })
  issue: Issue;

  @Column()
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  user: User;

  @Column()
  field: string; // 'status', 'assignee', 'priority', 'description', 'type', etc.

  @Column({ type: 'text', nullable: true })
  oldValue: string;

  @Column({ type: 'text', nullable: true })
  newValue: string;

  @Column()
  changeType: string; // 'field_change', 'status_change', 'comment', 'attachment', 'link', 'created', 'deleted', 'type_conversion'

  @Column({ type: 'text', nullable: true })
  description: string; // Human-readable description

  @Column()
  projectId: string;

  @CreateDateColumn()
  createdAt: Date;
}

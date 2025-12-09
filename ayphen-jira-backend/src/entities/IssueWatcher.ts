import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Issue } from './Issue';
import { User } from './User';

@Entity('issue_watchers')
export class IssueWatcher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  issueId: string;

  @ManyToOne(() => Issue, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issueId' })
  issue: Issue;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  watchedAt: Date;
}

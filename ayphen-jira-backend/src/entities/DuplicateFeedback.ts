import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Issue } from './Issue';
import { User } from './User';

@Entity('duplicate_feedback')
export class DuplicateFeedback {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'issue_id' })
  issueId!: string;

  @ManyToOne(() => Issue, { nullable: true })
  issue?: Issue;

  @Column({ name: 'suggested_duplicate_id' })
  suggestedDuplicateId!: string;

  @ManyToOne(() => Issue, { nullable: true })
  suggestedDuplicate?: Issue;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'ai_confidence' })
  aiConfidence!: number;

  @Column({ length: 20, name: 'user_action' })
  userAction!: 'dismissed' | 'linked' | 'merged' | 'blocked';

  @Column({ name: 'was_correct' })
  wasCorrect!: boolean;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { nullable: true })
  user?: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

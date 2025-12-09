import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';

@Entity('user_presence')
export class UserPresence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: string;

  @Column({ default: 'offline' }) // online, offline, away, busy
  status: string;

  @Column({ nullable: true })
  currentPage: string;

  @Column({ type: 'text', nullable: true })
  currentIssueId: string | null;

  @Column({ nullable: true })
  socketId: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  lastSeen: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

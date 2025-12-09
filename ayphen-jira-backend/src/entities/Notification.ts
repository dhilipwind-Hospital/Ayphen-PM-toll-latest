import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  type: string; // 'assigned', 'mentioned', 'status_changed', 'commented', etc.

  @Column()
  title: string;

  @Column()
  message: string;

  @Column({ nullable: true })
  issueId: string;

  @Column({ nullable: true })
  issueKey: string;

  @Column({ nullable: true })
  projectId: string;

  @Column({ default: false })
  read: boolean;

  @Column({ type: 'timestamp', nullable: true })
  snoozedUntil: Date;

  @Column({ nullable: true })
  actionUrl: string;

  @Column({ nullable: true })
  actorId: string;

  @Column({ nullable: true })
  actorName: string;

  @CreateDateColumn()
  createdAt: Date;
}

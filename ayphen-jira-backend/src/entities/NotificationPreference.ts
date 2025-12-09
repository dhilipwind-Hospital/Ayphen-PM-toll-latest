import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';

@Entity('notification_preferences')
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: string;

  // Notification Types
  @Column({ default: true })
  inAppNotifications: boolean;

  @Column({ default: true })
  emailNotifications: boolean;

  @Column({ default: false })
  desktopNotifications: boolean;

  @Column({ default: false })
  doNotDisturb: boolean;

  // Event-specific preferences
  @Column({ default: true })
  notifyOnAssignment: boolean;

  @Column({ default: true })
  notifyOnMention: boolean;

  @Column({ default: true })
  notifyOnComment: boolean;

  @Column({ default: true })
  notifyOnStatusChange: boolean;

  @Column({ default: true })
  notifyOnIssueUpdate: boolean;

  @Column({ default: true })
  notifyOnSprintStart: boolean;

  @Column({ default: true })
  notifyOnSprintComplete: boolean;

  // Email digest preferences
  @Column({ default: 'instant' }) // instant, daily, weekly, never
  emailDigestFrequency: string;

  @Column({ type: 'simple-array', nullable: true })
  mutedProjects: string[];

  @Column({ type: 'simple-array', nullable: true })
  mutedIssueTypes: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

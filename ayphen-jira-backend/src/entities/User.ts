import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: 'member' })
  role: string;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  jobTitle: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  timezone: string;

  @Column({ nullable: true })
  language: string;

  @Column({ nullable: true })
  dateFormat: string;

  @Column({ nullable: true })
  timeFormat: string;

  @Column({ nullable: true })
  theme: string;

  @Column({ default: true })
  notificationsEnabled: boolean;

  @Column({ default: true })
  emailNotifications: boolean;

  @Column({ default: true })
  desktopNotifications: boolean;

  @Column({ default: false })
  pushNotifications: boolean;

  @Column({ default: 'instant' })
  notificationFrequency: string;

  @Column({ default: false })
  twoFactorEnabled: boolean;

  @Column({ default: true })
  keyboardShortcutsEnabled: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isSystemAdmin: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deactivatedAt: Date;

  @Column({ nullable: true })
  deactivatedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ nullable: true })
  lastLoginIp: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

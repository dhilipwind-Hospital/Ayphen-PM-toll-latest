import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_logs')
@Index(['userId', 'createdAt'])
@Index(['action', 'createdAt'])
@Index(['entityType', 'entityId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  userName: string;

  @Column()
  action: string; // 'create', 'update', 'delete', 'view', 'login', 'logout'

  @Column()
  entityType: string; // 'issue', 'project', 'user', 'comment', etc.

  @Column({ nullable: true })
  entityId: string;

  @Column({ type: 'text', nullable: true })
  entityName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'simple-json', nullable: true })
  changes: any; // Before/after values

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ default: 'success' })
  status: string; // 'success', 'failure', 'warning'

  @CreateDateColumn()
  createdAt: Date;
}

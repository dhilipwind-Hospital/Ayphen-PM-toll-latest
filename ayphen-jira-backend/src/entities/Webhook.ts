import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('webhooks')
export class Webhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  url: string;

  @Column({ type: 'simple-json' })
  events: string[]; // ['issue.created', 'issue.updated', 'sprint.started', etc.]

  @Column({ nullable: true })
  secret: string; // For request signing

  @Column({ default: true })
  enabled: boolean;

  @Column({ nullable: true })
  projectId: string; // If webhook is project-specific

  @Column({ type: 'simple-json', nullable: true })
  filters: any; // Additional filters (e.g., only bugs, only high priority)

  @Column({ default: 0 })
  deliveryCount: number;

  @Column({ default: 0 })
  failureCount: number;

  @Column({ nullable: true })
  lastDeliveryAt: Date;

  @Column({ nullable: true })
  lastFailureAt: Date;

  @Column({ type: 'text', nullable: true })
  lastError: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

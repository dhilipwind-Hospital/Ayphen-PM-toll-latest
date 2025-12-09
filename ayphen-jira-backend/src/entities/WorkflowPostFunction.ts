import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('workflow_post_functions')
export class WorkflowPostFunction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workflowId: string;

  @Column()
  transitionId: string;

  @Column()
  name: string;

  @Column()
  type: string; // 'assign', 'update-field', 'send-notification', 'webhook', 'custom'

  @Column({ type: 'text' })
  config: string; // JSON configuration

  @Column({ default: true })
  enabled: boolean;

  @Column({ default: 0 })
  order: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

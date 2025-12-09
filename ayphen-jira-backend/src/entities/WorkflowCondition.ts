import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('workflow_conditions')
export class WorkflowCondition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workflowId: string;

  @Column()
  transitionId: string;

  @Column()
  name: string;

  @Column()
  type: string; // 'user', 'field', 'permission', 'custom'

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

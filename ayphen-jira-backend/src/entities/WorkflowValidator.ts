import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('workflow_validators')
export class WorkflowValidator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workflowId: string;

  @Column()
  transitionId: string;

  @Column()
  name: string;

  @Column()
  type: string; // 'required-field', 'field-format', 'permission', 'custom'

  @Column({ type: 'text' })
  config: string; // JSON configuration

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ default: true })
  enabled: boolean;

  @Column({ default: 0 })
  order: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

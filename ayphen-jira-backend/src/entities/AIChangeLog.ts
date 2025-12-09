import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ai_change_logs')
export class AIChangeLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  requirementId: string;

  @Column({ length: 50 })
  entityType: string; // 'story' or 'test_case'

  @Column()
  entityId: string;

  @Column({ length: 50 })
  changeType: string; // 'created', 'updated', 'flagged'

  @Column('text', { nullable: true })
  oldValue: string;

  @Column('text', { nullable: true })
  newValue: string;

  @CreateDateColumn()
  createdAt: Date;
}

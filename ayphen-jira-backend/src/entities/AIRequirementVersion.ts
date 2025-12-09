import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AIRequirement } from './AIRequirement';

@Entity('ai_requirement_versions')
export class AIRequirementVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AIRequirement)
  @JoinColumn({ name: 'requirementId' })
  requirement: AIRequirement;

  @Column()
  requirementId: string;

  @Column()
  version: number;

  @Column('text')
  content: string;

  @Column('text', { nullable: true })
  changes: string;

  @CreateDateColumn()
  createdAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from './Project';

@Entity('custom_fields')
export class CustomField {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  type: string; // 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'checkbox' | 'user'

  @Column('simple-json', { nullable: true })
  options: string[] | null;

  @Column({ nullable: true })
  projectId: string;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ default: false })
  isGlobal: boolean;

  @Column({ default: false })
  isRequired: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

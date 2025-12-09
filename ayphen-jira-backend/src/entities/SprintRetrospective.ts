import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Sprint } from './Sprint';
import { User } from './User';

@Entity('sprint_retrospectives')
export class SprintRetrospective {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sprintId: string;

  @ManyToOne(() => Sprint)
  @JoinColumn({ name: 'sprintId' })
  sprint: Sprint;

  @Column('simple-json')
  wentWell: string[];

  @Column('simple-json')
  improvements: string[];

  @Column('simple-json')
  actionItems: { task: string; assigneeId: string; status: string; completed: boolean }[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column()
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

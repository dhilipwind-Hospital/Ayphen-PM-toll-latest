import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('saved_filters')
export class SavedFilter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column('simple-json')
  filterConfig: {
    projectId?: string;
    status?: string[];
    type?: string[];
    priority?: string[];
    assigneeId?: string;
    reporterId?: string;
    labels?: string[];
    sprint?: string;
    epic?: string;
    searchText?: string;
    customFields?: Record<string, any>;
  };

  @Column()
  ownerId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ default: false })
  isShared: boolean;

  @Column({ default: false })
  isStarred: boolean;

  @Column({ default: false })
  isFavorite: boolean;

  @Column({ nullable: true })
  color: string;

  @Column({ default: 0 })
  usageCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastUsedAt: Date;
}

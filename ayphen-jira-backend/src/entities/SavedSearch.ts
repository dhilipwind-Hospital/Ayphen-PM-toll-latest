import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('saved_searches')
export class SavedSearch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  jql: string;

  @Column()
  ownerId: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ default: false })
  isStarred: boolean;

  @Column({ default: 'private' })
  visibility: string; // 'private', 'shared', 'public'

  @Column({ type: 'text', nullable: true })
  sharedWith: string | null; // JSON array of user IDs

  @Column({ type: 'text', nullable: true })
  columns: string | null; // JSON array of column configurations

  @Column({ type: 'text', nullable: true })
  folder: string | null;

  @Column({ default: false })
  emailSubscription: boolean;

  @Column({ type: 'text', nullable: true })
  emailFrequency: string | null; // 'instant', 'daily', 'weekly'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';

@Entity('dashboards')
export class Dashboard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => User, { nullable: true })
  owner: User;

  @Column({ nullable: true })
  ownerId: string;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ default: false })
  isStarred: boolean;

  @Column({ default: 'private' }) // private, shared, public
  visibility: string;

  @Column({ type: 'simple-json', nullable: true })
  layout: any; // Grid layout configuration

  @Column({ default: 2 }) // 1, 2, or 3 columns
  columns: number;

  @Column({ default: false })
  canvasMode: boolean;

  @Column({ type: 'simple-array', nullable: true })
  sharedWith: string[]; // User IDs

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('search_history')
export class SearchHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  query: string;

  @Column({ nullable: true })
  type: string; // 'jql', 'basic', 'advanced'

  @Column('simple-json', { nullable: true })
  filters: any;

  @Column({ default: 0 })
  resultCount: number;

  @CreateDateColumn()
  createdAt: Date;
}

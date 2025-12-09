import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Dashboard } from './Dashboard';

@Entity('gadgets')
export class Gadget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Dashboard, { onDelete: 'CASCADE' })
  dashboard: Dashboard;

  @Column()
  dashboardId: string;

  @Column()
  type: string; // filter-results, assigned-to-me, pie-chart, etc.

  @Column()
  title: string;

  @Column({ type: 'simple-json', nullable: true })
  config: any; // Gadget-specific configuration

  @Column({ type: 'simple-json', nullable: true })
  position: any; // { x, y, w, h } for grid layout

  @Column({ default: 15 }) // minutes
  refreshInterval: number;

  @Column({ default: true })
  enabled: boolean;

  @Column({ default: 0 })
  order: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

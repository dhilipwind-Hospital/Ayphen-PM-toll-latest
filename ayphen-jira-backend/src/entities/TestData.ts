import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('test_data')
export class TestData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  testCaseId: string;

  @Column({ length: 200 })
  name: string;

  @Column('json')
  data: any; // { username: 'test@example.com', password: 'test123', etc. }

  @Column({ length: 50, default: 'dev' })
  environment: string;

  @Column({ default: true })
  isActive: boolean;

  @Column('text', { nullable: true })
  description: string;

  @Column({ nullable: true })
  projectId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

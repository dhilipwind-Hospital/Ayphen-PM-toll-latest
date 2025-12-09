import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TestResult } from './TestResult';
import { Issue } from './Issue';

@Entity('test_defect_links')
export class TestDefectLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  testResultId: string;

  @ManyToOne(() => TestResult)
  @JoinColumn({ name: 'testResultId' })
  testResult: TestResult;

  @Column()
  defectId: string;

  @ManyToOne(() => Issue)
  @JoinColumn({ name: 'defectId' })
  defect: Issue;

  @Column({ length: 50, default: 'relates-to' })
  linkType: string; // blocks, is-blocked-by, relates-to

  @Column({ default: false })
  autoCreated: boolean;

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
}

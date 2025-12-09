import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Issue } from './Issue';

@Entity('issue_links')
export class IssueLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sourceIssueId: string;

  @Column()
  targetIssueId: string;

  @Column()
  linkType: string;

  @Column({ nullable: true })
  projectId: string;

  @CreateDateColumn()
  createdAt: Date;
  
  @ManyToOne(() => Issue)
  @JoinColumn({ name: 'sourceIssueId' })
  sourceIssue: Issue;
  
  @ManyToOne(() => Issue)
  @JoinColumn({ name: 'targetIssueId' })
  targetIssue: Issue;
}

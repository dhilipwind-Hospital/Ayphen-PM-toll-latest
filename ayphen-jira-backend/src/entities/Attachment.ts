import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Issue } from './Issue';
import { User } from './User';

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Issue, { onDelete: 'CASCADE' })
  issue: Issue;

  @Column()
  issueId: string;

  @ManyToOne(() => User)
  uploader: User;

  @Column()
  uploaderId: string;

  @Column()
  fileName: string;

  @Column()
  originalName: string;

  @Column()
  fileSize: number;

  @Column()
  mimeType: string;

  @Column()
  filePath: string;

  @Column({ type: 'text', nullable: true })
  thumbnailPath: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ default: false })
  isImage: boolean;

  @Column({ default: false })
  isDocument: boolean;

  @Column({ type: 'integer', nullable: true })
  width: number | null;

  @Column({ type: 'integer', nullable: true })
  height: number | null;

  @CreateDateColumn()
  uploadedAt: Date;
}

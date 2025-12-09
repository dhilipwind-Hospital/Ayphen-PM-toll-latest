import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ChatChannel } from './ChatChannel';
import { User } from './User';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  channelId: string;

  @Column()
  userId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'text'
  })
  messageType: 'text' | 'file' | 'image' | 'system';

  @Column({ type: 'json', nullable: true })
  mentions: string[]; // Array of user IDs

  @Column({ type: 'json', nullable: true })
  issueLinks: string[]; // Array of issue IDs

  @Column({ type: 'json', nullable: true })
  attachments: Array<{
    url: string;
    name: string;
    type: string;
    size: number;
  }>;

  @Column({ nullable: true })
  replyToId: string;

  @Column({ type: 'json', nullable: true })
  reactions: Record<string, string[]>; // { emoji: [userIds] }

  @Column({ nullable: true })
  editedAt: Date;

  @Column({ nullable: true })
  deletedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => ChatChannel, channel => channel.messages)
  @JoinColumn({ name: 'channelId' })
  channel: ChatChannel;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => ChatMessage, { nullable: true })
  @JoinColumn({ name: 'replyToId' })
  replyTo: ChatMessage;
}

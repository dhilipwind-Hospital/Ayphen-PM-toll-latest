import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Project } from './Project';
import { User } from './User';
import { ChatMessage } from './ChatMessage';
import { ChannelMember } from './ChannelMember';

@Entity('chat_channels')
export class ChatChannel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'group'
  })
  type: 'project' | 'direct' | 'group' | 'organization';

  @Column({ nullable: true })
  projectId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: false })
  isPrivate: boolean;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  archivedAt: Date;

  // Relations
  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @OneToMany(() => ChatMessage, message => message.channel)
  messages: ChatMessage[];

  @OneToMany(() => ChannelMember, member => member.channel)
  members: ChannelMember[];
}

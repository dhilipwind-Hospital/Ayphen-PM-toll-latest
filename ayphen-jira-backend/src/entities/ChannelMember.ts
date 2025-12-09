import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ChatChannel } from './ChatChannel';
import { User } from './User';

@Entity('channel_members')
export class ChannelMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  channelId: string;

  @Column()
  userId: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'member'
  })
  role: 'owner' | 'admin' | 'member';

  @CreateDateColumn()
  joinedAt: Date;

  @Column({ nullable: true })
  lastReadAt: Date;

  @Column({ type: 'json', nullable: true })
  notificationSettings: {
    muted: boolean;
    mentionsOnly: boolean;
  };

  // Relations
  @ManyToOne(() => ChatChannel, channel => channel.members)
  @JoinColumn({ name: 'channelId' })
  channel: ChatChannel;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}

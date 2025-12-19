import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { MentionsInput, Mention } from 'react-mentions';
import { Input, Button, Avatar, Badge, Tag, Tooltip, Spin, message as antMessage, Modal, List, Dropdown, Menu } from 'antd';
import { Send, Users, Search, MoreVertical, Paperclip, Smile, Image as ImageIcon, File } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { io, Socket } from 'socket.io-client';

// WS_URL kept for socket connection
const WS_URL = 'https://ayphen-pm-toll-latest.onrender.com';

const Container = styled.div`
  display: flex;
  height: calc(100vh - 56px);
  background: #fff;
`;

const Sidebar = styled.div`
  width: 280px;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
`;

const SearchBox = styled(Input)`
  margin: 16px;
  width: calc(100% - 32px);
`;

const ChannelList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ChannelItem = styled.div<{ $active?: boolean }>`
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  background: ${props => props.$active ? '#f9f0ff' : 'transparent'};
  border-left: 3px solid ${props => props.$active ? '#0EA5E9' : 'transparent'};
  
  &:hover {
    background: #fafafa;
  }
`;

const ChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ChatHeader = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Message = styled.div<{ isOwn?: boolean }>`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex-direction: ${props => props.isOwn ? 'row-reverse' : 'row'};
`;

const MessageBubble = styled.div<{ isOwn?: boolean }>`
  max-width: 60%;
  padding: 12px 16px;
  border-radius: 12px;
  background: ${props => props.isOwn ? 'linear-gradient(135deg, #38BDF8, #0EA5E9)' : '#f5f5f5'};
  color: ${props => props.isOwn ? '#fff' : '#000'};
  
  .mention {
    color: ${props => props.isOwn ? '#fff' : '#1890ff'};
    background: ${props => props.isOwn ? 'rgba(255,255,255,0.2)' : '#e6f7ff'};
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 500;
  }
  
  .issue-link {
    color: ${props => props.isOwn ? '#fff' : '#52c41a'};
    background: ${props => props.isOwn ? 'rgba(255,255,255,0.2)' : '#f6ffed'};
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const MessageInput = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InputRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-end;
  
  & > div {
    flex: 1;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const IconButton = styled(Button)`
  border: none;
  background: transparent;
  color: #8c8c8c;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  
  &:hover {
    background: #f5f5f5 !important;
    color: #0EA5E9 !important;
  }
`;

const SendButton = styled(Button)`
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #38BDF8, #0EA5E9);
  border: none;
  color: white;
  
  span {
    color: white !important;
  }
  
  &:hover {
    background: linear-gradient(135deg, #0EA5E9, #0284C7) !important;
    color: white !important;
  }
  
  &:disabled {
    background: #d9d9d9 !important;
    color: #fff !important;
    opacity: 0.5;
  }
`;

const AttachmentPreview = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px;
  background: #fafafa;
  border-radius: 4px;
`;

const AttachmentItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
  
  .remove {
    cursor: pointer;
    color: #ff4d4f;
    
    &:hover {
      color: #cf1322;
    }
  }
`;

const SuggestionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

interface Channel {
  id: string;
  name: string;
  type: string;
  projectId?: string;
  projectName?: string;
  lastMessage?: any;
  unreadCount?: number;
  memberCount?: number;
}

interface Message {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  mentions?: string[];
  issueLinks?: string[];
  timestamp: Date;
}

export const TeamChatEnhanced: React.FC = () => {
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [channelMembers, setChannelMembers] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadChannels();

      // Initialize WebSocket connection
      socketRef.current = io(WS_URL, {
        query: { userId: user.id }
      });

      socketRef.current.on('connect', () => {
      });

      socketRef.current.on('new_message', (message: Message) => {
        // Only add message if it's for the active channel
        if (message.channelId === activeChannel?.id) {
          setMessages(prev => [...prev, message]);
        }
        // Update channel list to show new message
        loadChannels();
      });

      socketRef.current.on('disconnect', () => {
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [user]);

  useEffect(() => {
    if (activeChannel) {
      loadMessages(activeChannel.id);

      // Join channel room for real-time updates
      if (socketRef.current) {
        socketRef.current.emit('join_channel', activeChannel.id);
      }
    }

    return () => {
      // Leave previous channel room
      if (activeChannel && socketRef.current) {
        socketRef.current.emit('leave_channel', activeChannel.id);
      }
    };
  }, [activeChannel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChannels = async () => {
    try {
      const response = await api.get('/chat-v2/channels', {
        params: { userId: user?.id }
      });

      // If no channels exist, initialize default channels
      if (response.data.length === 0 && user?.id) {
        try {
          await api.post('/chat-v2/initialize', {
            userId: user.id
          });
          // Reload channels after initialization
          const reloadResponse = await api.get('/chat-v2/channels', {
            params: { userId: user.id }
          });
          setChannels(reloadResponse.data);
          if (reloadResponse.data.length > 0) {
            setActiveChannel(reloadResponse.data[0]);
          }
          antMessage.success('Chat channels initialized!');
        } catch (initError) {
          console.error('Failed to initialize channels:', initError);
          antMessage.error('Failed to initialize chat channels');
        }
      } else {
        setChannels(response.data);
        if (response.data.length > 0) {
          setActiveChannel(response.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load channels:', error);
      antMessage.error('Failed to load channels');
    }
  };

  const loadMessages = async (channelId: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/chat-v2/channels/${channelId}/messages`);
      setMessages(response.data || []);

      // Mark as read
      await api.post(`/chat-v2/channels/${channelId}/read`, {
        userId: user?.id
      });
    } catch (error: any) {
      console.error('Failed to load messages:', error);
      setMessages([]);

      // Handle specific error cases
      if (error.response?.status === 404) {
        antMessage.error('Channel not found or you are not a member');
      } else if (error.response?.status === 403) {
        antMessage.error('You do not have permission to view this channel');
      } else {
        antMessage.error('Failed to load messages. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (query: string, callback: (data: any[]) => void) => {
    try {
      const response = await api.get('/chat-v2/members/suggestions', {
        params: {
          q: query,
          channelId: activeChannel?.id,
          projectId: activeChannel?.projectId
        }
      });
      callback(response.data);
    } catch (error) {
      console.error('Error fetching members:', error);
      callback([]);
    }
  };

  const fetchIssues = async (query: string, callback: (data: any[]) => void) => {
    try {
      const response = await api.get('/chat-v2/issues/suggestions', {
        params: {
          q: query,
          projectId: activeChannel?.projectId
        }
      });
      callback(response.data);
    } catch (error) {
      console.error('Error fetching issues:', error);
      callback([]);
    }
  };

  const sendMessage = async () => {
    if ((!inputValue.trim() && attachments.length === 0) || !activeChannel || !user) return;

    // Extract mentions
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(inputValue)) !== null) {
      mentions.push(match[2]);
    }

    // Extract issue links
    const issueLinkRegex = /#\[([^\]]+)\]\(([^)]+)\)/g;
    const issueLinks: string[] = [];
    while ((match = issueLinkRegex.exec(inputValue)) !== null) {
      issueLinks.push(match[2]);
    }

    try {
      let uploadedAttachments: any[] = [];

      // Upload attachments if any
      if (attachments.length > 0) {
        const formData = new FormData();
        attachments.forEach(file => {
          formData.append('files', file);
        });

        try {
          const uploadRes = await fetch('https://ayphen-pm-toll-latest.onrender.com/api/attachments-v2/upload-multiple', {
            method: 'POST',
            body: formData
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            uploadedAttachments = uploadData.map((f: any) => ({
              filename: f.filename,
              url: `https://ayphen-pm-toll-latest.onrender.com/uploads/${f.filename}`,
              type: f.mimetype,
              size: f.size
            }));
          }
        } catch (uploadError) {
          console.error('Failed to upload attachments:', uploadError);
          antMessage.warning('Some attachments failed to upload');
        }
      }

      // Build message content with attachment references
      let messageContent = inputValue;
      if (uploadedAttachments.length > 0) {
        const attachmentRefs = uploadedAttachments.map(a => `[file: ${a.filename}]`).join(' ');
        messageContent = messageContent ? `${messageContent}\n${attachmentRefs}` : attachmentRefs;
      }

      const response = await api.post(
        `/chat-v2/channels/${activeChannel.id}/messages`,
        {
          content: messageContent,
          userId: user.id,
          mentions,
          issueLinks,
          attachments: uploadedAttachments
        }
      );

      setMessages([...messages, response.data]);
      setInputValue('');
      setAttachments([]); // Clear attachments after send
    } catch (error) {
      console.error('Failed to send message:', error);
      antMessage.error('Failed to send message');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputValue(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const loadChannelMembers = async () => {
    if (!activeChannel) return;
    try {
      const response = await api.get(`/chat-v2/channels/${activeChannel.id}/members`);
      setChannelMembers(response.data);
      setShowMembersModal(true);
    } catch (error) {
      console.error('Failed to load members:', error);
      antMessage.error('Failed to load channel members');
    }
  };

  const handleMoreMenuClick = (key: string) => {
    switch (key) {
      case 'settings':
        antMessage.info('Channel settings coming soon');
        break;
      case 'notifications':
        antMessage.info('Notification settings coming soon');
        break;
      case 'leave':
        Modal.confirm({
          title: 'Leave Channel',
          content: `Are you sure you want to leave ${activeChannel?.name}?`,
          okText: 'Leave',
          okType: 'danger',
          onOk: () => {
            antMessage.success('Left channel');
          }
        });
        break;
      default:
        break;
    }
  };

  const renderMessageContent = (content: string) => {
    let rendered = content;

    // Highlight mentions
    rendered = rendered.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '<span class="mention">@$1</span>');

    // Highlight issue links
    rendered = rendered.replace(/#\[([^\]]+)\]\(([^)]+)\)/g, '<span class="issue-link">#$1</span>');

    return <div dangerouslySetInnerHTML={{ __html: rendered }} />;
  };

  return (
    <Container>
      <Sidebar>
        <SearchBox placeholder="Search channels..." prefix={<Search size={16} />} />
        <ChannelList>
          {channels.map(channel => (
            <ChannelItem
              key={channel.id}
              $active={activeChannel?.id === channel.id}
              onClick={() => setActiveChannel(channel)}
            >
              <Avatar style={{ background: '#0EA5E9' }}>
                {channel.name[0].toUpperCase()}
              </Avatar>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{channel.name}</div>
                {channel.projectName && (
                  <div style={{ fontSize: 11, color: '#999' }}>{channel.projectName}</div>
                )}
                {channel.lastMessage && (
                  <div style={{ fontSize: 12, color: '#999' }}>
                    {channel.lastMessage.content}
                  </div>
                )}
              </div>
              {channel.unreadCount && channel.unreadCount > 0 && (
                <Badge count={channel.unreadCount} />
              )}
            </ChannelItem>
          ))}
        </ChannelList>
      </Sidebar>

      <ChatArea>
        {activeChannel ? (
          <>
            <ChatHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar style={{ background: '#0EA5E9' }}>
                  {activeChannel.name[0].toUpperCase()}
                </Avatar>
                <div>
                  <div style={{ fontWeight: 600 }}>{activeChannel.name}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    {activeChannel.memberCount} members
                    {activeChannel.projectName && ` • ${activeChannel.projectName}`}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Tooltip title="Members">
                  <Button
                    icon={<Users size={16} />}
                    type="text"
                    onClick={loadChannelMembers}
                  />
                </Tooltip>
                <Dropdown
                  overlay={
                    <Menu onClick={({ key }) => handleMoreMenuClick(key)}>
                      <Menu.Item key="settings">Channel Settings</Menu.Item>
                      <Menu.Item key="notifications">Notifications</Menu.Item>
                      <Menu.Divider />
                      <Menu.Item key="leave" danger>Leave Channel</Menu.Item>
                    </Menu>
                  }
                  trigger={['click']}
                >
                  <Button icon={<MoreVertical size={16} />} type="text" />
                </Dropdown>
              </div>
            </ChatHeader>

            <MessagesContainer>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Spin />
                </div>
              ) : (
                <>
                  {messages.map(msg => (
                    <Message key={msg.id} isOwn={msg.userId === user?.id}>
                      <Avatar style={{ background: '#0EA5E9' }} src={msg.userAvatar}>
                        {msg.userName[0]?.toUpperCase()}
                      </Avatar>
                      <div>
                        <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>
                          {msg.userName} • {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                        <MessageBubble isOwn={msg.userId === user?.id}>
                          {renderMessageContent(msg.content)}
                        </MessageBubble>
                      </div>
                    </Message>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </MessagesContainer>

            <MessageInput>
              {attachments.length > 0 && (
                <AttachmentPreview>
                  {attachments.map((file, index) => (
                    <AttachmentItem key={index}>
                      <File size={14} />
                      <span>{file.name}</span>
                      <span className="remove" onClick={() => handleRemoveAttachment(index)}>×</span>
                    </AttachmentItem>
                  ))}
                </AttachmentPreview>
              )}

              <InputRow>
                <ActionButtons>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />
                  <Tooltip title="Attach file">
                    <IconButton onClick={() => fileInputRef.current?.click()}>
                      <Paperclip size={18} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Add emoji">
                    <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                      <Smile size={18} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Insert image">
                    <IconButton onClick={() => fileInputRef.current?.click()}>
                      <ImageIcon size={18} />
                    </IconButton>
                  </Tooltip>
                </ActionButtons>

                <MentionsInput
                  value={inputValue ?? ''}
                  onChange={(_e: any, newValue: string) => setInputValue(newValue ?? '')}
                  placeholder="Type @ to mention, # for issues..."
                  style={{
                    control: {
                      fontSize: 14,
                      fontWeight: 'normal',
                    },
                    input: {
                      border: '1px solid #d9d9d9',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      minHeight: '40px',
                    },
                    highlighter: {
                      padding: '8px 12px',
                    },
                    suggestions: {
                      list: {
                        background: 'white',
                        border: '1px solid #f0f0f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        maxHeight: '200px',
                        overflowY: 'auto',
                      },
                      item: {
                        padding: '8px 12px',
                        cursor: 'pointer',
                        '&focused': {
                          background: '#f5f5f5',
                        },
                      },
                    },
                  }}
                  onKeyPress={(e: any) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                >
                  <Mention
                    trigger="@"
                    data={fetchMembers}
                    markup="@[__display__](__id__)"
                    renderSuggestion={(entry: any) => (
                      <SuggestionItem>
                        <Avatar size="small" src={entry.avatar}>
                          {entry.name[0]}
                        </Avatar>
                        <span>{entry.name}</span>
                      </SuggestionItem>
                    )}
                    displayTransform={(_id: string, display: string) => `@${display}`}
                  />
                  <Mention
                    trigger="#"
                    data={fetchIssues}
                    markup="#[__display__](__id__)"
                    renderSuggestion={(entry: any) => (
                      <SuggestionItem>
                        <Tag color="blue">{entry.key}</Tag>
                        <span>{entry.title}</span>
                      </SuggestionItem>
                    )}
                    displayTransform={(_id: string, display: string) => `#${display}`}
                  />
                </MentionsInput>

                <SendButton
                  onClick={sendMessage}
                  disabled={!inputValue.trim() && attachments.length === 0}
                >
                  <Send size={16} />
                </SendButton>
              </InputRow>

              {showEmojiPicker && (
                <div style={{ padding: '8px', background: '#fafafa', borderRadius: '4px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '👍', '👎', '👏', '🙌', '🤝', '💪', '🎉', '🎊', '🔥', '✨', '⭐', '💯', '✅', '❌', '⚠️', '📌', '🚀', '💡', '🎯'].map(emoji => (
                    <span
                      key={emoji}
                      onClick={() => handleEmojiSelect(emoji)}
                      style={{ cursor: 'pointer', fontSize: '20px', padding: '4px' }}
                    >
                      {emoji}
                    </span>
                  ))}
                </div>
              )}
            </MessageInput>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ textAlign: 'center', color: '#999' }}>
              <Users size={48} style={{ marginBottom: 16 }} />
              <div>Select a channel to start chatting</div>
            </div>
          </div>
        )}
      </ChatArea>

      {/* Members Modal */}
      <Modal
        title={`${activeChannel?.name} Members`}
        open={showMembersModal}
        onCancel={() => setShowMembersModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowMembersModal(false)}>
            Close
          </Button>
        ]}
        width={500}
      >
        <List
          dataSource={channelMembers}
          renderItem={(member: any) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar src={member.userAvatar}>{member.userName?.[0]}</Avatar>}
                title={member.userName}
                description={
                  <div>
                    <Tag color={member.role === 'owner' ? 'gold' : 'blue'}>
                      {member.role}
                    </Tag>
                    {member.userEmail}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </Container>
  );
};

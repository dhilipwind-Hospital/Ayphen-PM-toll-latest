import React from 'react';
import { Avatar, Tooltip, Badge } from 'antd';
import styled from 'styled-components';
import { UserOutlined } from '@ant-design/icons';

interface ActiveUser {
  userId: string;
  userName: string;
  userAvatar?: string;
  color: string;
  joinedAt: Date;
}

interface ActiveUsersBarProps {
  users: ActiveUser[];
  maxDisplay?: number;
}

const ActiveUsersBar: React.FC<ActiveUsersBarProps> = ({ users, maxDisplay = 5 }) => {
  const displayUsers = users.slice(0, maxDisplay);
  const remainingCount = users.length - maxDisplay;

  if (users.length === 0) {
    return null;
  }

  return (
    <Container>
      <Label>Viewing now:</Label>
      <AvatarGroup>
        {displayUsers.map((user) => (
          <Tooltip 
            key={user.userId} 
            title={`${user.userName} is viewing`}
            placement="bottom"
          >
            <StyledBadge color={user.color} dot>
              <StyledAvatar
                size="small"
                src={user.userAvatar}
                icon={!user.userAvatar && <UserOutlined />}
                style={{ borderColor: user.color }}
              />
            </StyledBadge>
          </Tooltip>
        ))}
        {remainingCount > 0 && (
          <Tooltip 
            title={`${remainingCount} more user${remainingCount > 1 ? 's' : ''}`}
            placement="bottom"
          >
            <MoreAvatar size="small">
              +{remainingCount}
            </MoreAvatar>
          </Tooltip>
        )}
      </AvatarGroup>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 6px;
`;

const Label = styled.span`
  font-size: 12px;
  color: #595959;
  font-weight: 500;
`;

const AvatarGroup = styled.div`
  display: flex;
  align-items: center;
  gap: -8px;
  
  & > * {
    margin-left: -8px;
    
    &:first-child {
      margin-left: 0;
    }
  }
`;

const StyledBadge = styled(Badge)`
  .ant-badge-dot {
    width: 8px;
    height: 8px;
    box-shadow: 0 0 0 2px #fff;
  }
`;

const StyledAvatar = styled(Avatar)`
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    transform: scale(1.1);
    z-index: 10;
  }
`;

const MoreAvatar = styled(Avatar)`
  background: #d9d9d9;
  color: #595959;
  font-size: 11px;
  font-weight: 600;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  
  &:hover {
    background: #bfbfbf;
  }
`;

export default ActiveUsersBar;

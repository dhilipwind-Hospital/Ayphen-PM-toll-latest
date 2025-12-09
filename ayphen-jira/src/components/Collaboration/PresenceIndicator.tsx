import { Avatar, AvatarGroup, Tooltip } from '@mui/material';
import { useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
}

export default function PresenceIndicator({ issueId }: { issueId: string }) {
  const [activeUsers, setActiveUsers] = useState<User[]>([]);

  useEffect(() => {
    const mockUsers: User[] = [
      { id: '1', name: 'John Doe' },
      { id: '2', name: 'Jane Smith' }
    ];
    setActiveUsers(mockUsers);
  }, [issueId]);

  if (activeUsers.length === 0) return null;

  return (
    <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 32, height: 32 } }}>
      {activeUsers.map(user => (
        <Tooltip key={user.id} title={`${user.name} is viewing`}>
          <Avatar sx={{ bgcolor: '#1976d2' }}>{user.name[0]}</Avatar>
        </Tooltip>
      ))}
    </AvatarGroup>
  );
}

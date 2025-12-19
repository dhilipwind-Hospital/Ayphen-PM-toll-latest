import { Avatar, Tooltip } from 'antd';
import { useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
}

export default function PresenceIndicator({ issueId }: { issueId: string }) {
  const [activeUsers, setActiveUsers] = useState<User[]>([]);

  useEffect(() => {
    // Show current user as viewing this issue
    // In a real implementation, this would use WebSockets
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName') || 'Current User';

    if (userId) {
      setActiveUsers([{ id: userId, name: userName }]);
    } else {
      setActiveUsers([]);
    }
  }, [issueId]);

  if (activeUsers.length === 0) return null;

  return (
    <Avatar.Group maxCount={4} size={32}>
      {activeUsers.map(user => (
        <Tooltip key={user.id} title={`${user.name} is viewing`}>
          <Avatar style={{ backgroundColor: '#0EA5E9' }}>{user.name[0]}</Avatar>
        </Tooltip>
      ))}
    </Avatar.Group>
  );
}

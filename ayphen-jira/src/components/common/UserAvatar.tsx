import React from 'react';
import { Avatar, Tooltip } from 'antd';
import type { AvatarProps } from 'antd';

interface UserAvatarProps extends AvatarProps {
    user?: {
        name?: string;
        avatar?: string;
        email?: string;
    } | null;
    showTooltip?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, showTooltip = true, ...props }) => {
    if (!user) {
        return <Avatar {...props} style={{ backgroundColor: '#ccc', ...props.style }}>?</Avatar>;
    }

    const initials = user.name
        ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : user.email?.substring(0, 2).toUpperCase() || '?';

    const avatar = (
        <Avatar
            src={user.avatar}
            alt={user.name}
            style={{
                backgroundColor: props.style?.backgroundColor || '#0052CC', // Default blue 
                ...props.style
            }}
            {...props}
        >
            {initials}
        </Avatar>
    );

    if (showTooltip) {
        return <Tooltip title={user.name}>{avatar}</Tooltip>;
    }

    return avatar;
};

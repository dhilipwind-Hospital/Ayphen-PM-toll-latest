import React, { useState, useEffect } from 'react';
import { Switch } from 'antd';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';
import styled from 'styled-components';

const ThemeSwitcherContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const ThemeSwitcher: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.body.classList.add('dark-theme');
    }
  }, []);

  const handleThemeToggle = (checked: boolean) => {
    setIsDark(checked);
    if (checked) {
      localStorage.setItem('theme', 'dark');
      document.body.classList.add('dark-theme');
    } else {
      localStorage.setItem('theme', 'light');
      document.body.classList.remove('dark-theme');
    }
  };

  return (
    <ThemeSwitcherContainer>
      {isDark ? <BulbFilled style={{ color: '#faad14' }} /> : <BulbOutlined />}
      <Switch checked={isDark} onChange={handleThemeToggle} size="small" />
    </ThemeSwitcherContainer>
  );
};

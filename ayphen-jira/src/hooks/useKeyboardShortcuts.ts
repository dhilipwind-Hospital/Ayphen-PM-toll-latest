import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();

  const shortcuts: ShortcutConfig[] = [
    {
      key: 'g',
      action: () => navigate('/dashboard'),
      description: 'Go to Dashboard'
    },
    {
      key: 'b',
      action: () => navigate('/board'),
      description: 'Go to Board'
    },
    {
      key: 'i',
      action: () => navigate('/issues'),
      description: 'Go to Issues'
    },
    {
      key: 'p',
      action: () => navigate('/projects'),
      description: 'Go to Projects'
    },
    {
      key: 'c',
      action: () => {
        const createButton = document.querySelector('[data-testid="create-issue-button"]') as HTMLElement;
        createButton?.click();
      },
      description: 'Create Issue'
    },
    {
      key: '/',
      action: () => {
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        searchInput?.focus();
      },
      description: 'Focus Search'
    },
    {
      key: '?',
      shiftKey: true,
      action: () => showShortcutsHelp(),
      description: 'Show Shortcuts Help'
    },
    {
      key: 'Escape',
      action: () => {
        // Close modals, clear focus
        const activeElement = document.activeElement as HTMLElement;
        activeElement?.blur();
      },
      description: 'Clear Focus/Close Modals'
    }
  ];

  const showShortcutsHelp = () => {
    const helpText = shortcuts
      .map(s => `${s.key.toUpperCase()}: ${s.description}`)
      .join('\n');
    
    message.info({
      content: `Keyboard Shortcuts:\n\n${helpText}`,
      duration: 10
    });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement)?.contentEditable === 'true'
      ) {
        // Allow Escape to clear focus
        if (event.key === 'Escape') {
          (event.target as HTMLElement).blur();
        }
        return;
      }

      const shortcut = shortcuts.find(s => 
        s.key.toLowerCase() === event.key.toLowerCase() &&
        !!s.ctrlKey === event.ctrlKey &&
        !!s.shiftKey === event.shiftKey &&
        !!s.altKey === event.altKey
      );

      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return { shortcuts, showShortcutsHelp };
};
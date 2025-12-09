import React, { useState } from 'react';
import { FloatButton } from 'antd';
import { Plus, FileText, Bug, Layers, Zap, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CreateIssueModal } from '../CreateIssueModal';

export const QuickActionsFAB: React.FC = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [issueType, setIssueType] = useState<string>('task');
  const navigate = useNavigate();

  return (
    <>
      <FloatButton.Group
        trigger="click"
        type="primary"
        style={{ right: 24, bottom: 24 }}
        icon={<Plus size={20} />}
      >
        <FloatButton
          icon={<FileText size={16} />}
          tooltip="Create Story"
          onClick={() => {
            setIssueType('story');
            setCreateModalOpen(true);
          }}
        />
        <FloatButton
          icon={<Bug size={16} />}
          tooltip="Create Bug"
          onClick={() => {
            setIssueType('bug');
            setCreateModalOpen(true);
          }}
        />
        <FloatButton
          icon={<Layers size={16} />}
          tooltip="Create Epic"
          onClick={() => {
            setIssueType('epic');
            setCreateModalOpen(true);
          }}
        />
        <FloatButton
          icon={<Zap size={16} />}
          tooltip="AI Test Automation"
          onClick={() => navigate('/ai-test-automation')}
        />
        <FloatButton
          icon={<Calendar size={16} />}
          tooltip="Sprint Planning"
          onClick={() => navigate('/sprint-planning')}
        />
      </FloatButton.Group>

      <CreateIssueModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => window.location.reload()}
        defaultType={issueType}
      />
    </>
  );
};

import React, { useState } from 'react';
import styled from 'styled-components';
import { Button, Dropdown, Modal, Input, message } from 'antd';
import type { MenuProps } from 'antd';
import { Save, ChevronDown, Star, Trash2 } from 'lucide-react';
import { colors } from '../theme/colors';

const ViewButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export interface SavedView {
  id: string;
  name: string;
  filters: any;
  groupBy: string;
  isDefault: boolean;
}

export interface SavedViewsDropdownProps {
  views: SavedView[];
  currentView: SavedView | null;
  onLoadView: (view: SavedView) => void;
  onSaveView: (name: string) => void;
  onDeleteView: (id: string) => void;
  onSetDefault: (id: string) => void;
}

export const SavedViewsDropdown: React.FC<SavedViewsDropdownProps> = ({
  views,
  currentView,
  onLoadView,
  onSaveView,
  onDeleteView,
  onSetDefault,
}) => {
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [viewName, setViewName] = useState('');

  const handleSave = () => {
    if (!viewName.trim()) {
      message.error('Please enter a view name');
      return;
    }
    onSaveView(viewName);
    setViewName('');
    setSaveModalVisible(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    Modal.confirm({
      title: 'Delete View',
      content: 'Are you sure you want to delete this view?',
      okText: 'Delete',
      okType: 'danger',
      onOk: () => onDeleteView(id),
    });
  };

  const menuItems: MenuProps['items'] = [
    ...(views.length > 0
      ? views.map(view => ({
          key: view.id,
          label: (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <span>
                {view.isDefault && <Star size={14} style={{ marginRight: 8, color: '#FFAB00' }} />}
                {view.name}
              </span>
              <Trash2
                size={14}
                style={{ color: '#DE350B', cursor: 'pointer' }}
                onClick={(e: any) => handleDelete(e, view.id)}
              />
            </div>
          ),
          onClick: () => onLoadView(view),
        }))
      : []),
    ...(views.length > 0 ? [{ type: 'divider' as const }] : []),
    {
      key: 'save-new',
      label: (
        <span>
          <Save size={14} style={{ marginRight: 8 }} />
          Save Current View
        </span>
      ),
      onClick: () => setSaveModalVisible(true),
    },
  ];

  return (
    <>
      <Dropdown menu={{ items: menuItems }} trigger={['click']}>
        <ViewButton>
          {currentView ? currentView.name : 'Default View'}
          <ChevronDown size={16} />
        </ViewButton>
      </Dropdown>

      <Modal
        title="Save View"
        open={saveModalVisible}
        onCancel={() => {
          setSaveModalVisible(false);
          setViewName('');
        }}
        onOk={handleSave}
        okText="Save"
      >
        <Input
          placeholder="View name (e.g., My Sprint Work)"
          value={viewName}
          onChange={(e) => setViewName(e.target.value)}
          onPressEnter={handleSave}
          autoFocus
        />
      </Modal>
    </>
  );
};

import React, { useState, useCallback, useEffect } from 'react';
import GridLayout from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import styled from 'styled-components';
import { Card, Button, Dropdown, Menu } from 'antd';
import { Plus, Settings, X, Maximize2, Minimize2 } from 'lucide-react';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const DashboardContainer = styled.div`
  padding: 20px;
  background: #f5f5f5;
  min-height: calc(100vh - 56px);
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const DashboardTitle = styled.h2`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
`;

const GadgetCard = styled(Card)`
  height: 100%;
  .ant-card-body {
    height: calc(100% - 57px);
    overflow: auto;
  }
`;

const GadgetHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const GadgetTitle = styled.h4`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
`;

const GadgetActions = styled.div`
  display: flex;
  gap: 8px;
`;

interface Gadget {
  id: string;
  type: string;
  title: string;
  config: any;
  position: { x: number; y: number; w: number; h: number };
}

interface DashboardGridProps {
  dashboardId: string;
  gadgets: Gadget[];
  isEditMode: boolean;
  onLayoutChange?: (layout: Layout[]) => void;
  onAddGadget?: () => void;
  onRemoveGadget?: (gadgetId: string) => void;
  onConfigureGadget?: (gadgetId: string) => void;
  renderGadget: (gadget: Gadget) => React.ReactNode;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  dashboardId,
  gadgets,
  isEditMode,
  onLayoutChange,
  onAddGadget,
  onRemoveGadget,
  onConfigureGadget,
  renderGadget,
}) => {
  const [layout, setLayout] = useState<Layout[]>([]);

  // Update layout when gadgets change
  useEffect(() => {
    const newLayout = gadgets.map(g => ({
      i: g.id,
      x: g.position?.x || 0,
      y: g.position?.y || 0,
      w: g.position?.w || 6,
      h: g.position?.h || 4,
      minW: 3,
      minH: 3,
    }));
    setLayout(newLayout);
  }, [gadgets]);

  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    setLayout(newLayout);
    if (onLayoutChange) {
      onLayoutChange(newLayout);
    }
  }, [onLayoutChange]);

  const gadgetMenu = (gadgetId: string) => (
    <Menu>
      <Menu.Item
        key="configure"
        icon={<Settings size={14} />}
        onClick={() => onConfigureGadget?.(gadgetId)}
      >
        Configure
      </Menu.Item>
      <Menu.Item
        key="maximize"
        icon={<Maximize2 size={14} />}
      >
        Maximize
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="remove"
        icon={<X size={14} />}
        danger
        onClick={() => onRemoveGadget?.(gadgetId)}
      >
        Remove
      </Menu.Item>
    </Menu>
  );

  return (
    <DashboardContainer>
      <DashboardHeader>
        <DashboardTitle>Dashboard</DashboardTitle>
        <div style={{ display: 'flex', gap: 8 }}>
          {isEditMode && (
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={onAddGadget}
            >
              Add Gadget
            </Button>
          )}
        </div>
      </DashboardHeader>

      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={60}
        width={1200}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".gadget-drag-handle"
      >
        {gadgets.map(gadget => (
          <div key={gadget.id}>
            <GadgetCard
              title={
                <GadgetHeader>
                  <GadgetTitle className="gadget-drag-handle" style={{ cursor: isEditMode ? 'move' : 'default' }}>
                    {gadget.title}
                  </GadgetTitle>
                  {isEditMode && (
                    <GadgetActions>
                      <Dropdown overlay={gadgetMenu(gadget.id)} trigger={['click']}>
                        <Button type="text" size="small" icon={<Settings size={14} />} />
                      </Dropdown>
                    </GadgetActions>
                  )}
                </GadgetHeader>
              }
            >
              {renderGadget(gadget)}
            </GadgetCard>
          </div>
        ))}
      </GridLayout>
    </DashboardContainer>
  );
};

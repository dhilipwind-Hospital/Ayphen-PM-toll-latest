import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Card, List, Button, Modal, Form, Input, Select, Tag, Dropdown, message, Empty, Tooltip } from 'antd';
import { Star, Filter, Share2, Trash2, Edit, MoreVertical, Plus, Clock } from 'lucide-react';
import axios from 'axios';
import { useStore } from '../../store/useStore';
import { colors } from '../../theme/colors';

const Container = styled.div`
  padding: 24px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 0;
`;

const FilterCard = styled(Card)`
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    transform: translateY(-2px);
  }
`;

const FilterHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const FilterName = styled.div`
  font-weight: 600;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FilterDescription = styled.div`
  color: ${colors.text.secondary};
  font-size: 13px;
  margin-bottom: 8px;
`;

const FilterMeta = styled.div`
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: ${colors.text.secondary};
`;

const ColorDot = styled.div<{ color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.color};
`;

interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  filterConfig: any;
  ownerId: string;
  isShared: boolean;
  isStarred: boolean;
  isFavorite: boolean;
  color?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

export const SavedFiltersList: React.FC = () => {
  const { currentUser } = useStore();
  const [filters, setFilters] = useState<SavedFilter[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFilter, setEditingFilter] = useState<SavedFilter | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchFilters();
  }, [currentUser]);

  const fetchFilters = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`https://ayphen-pm-toll-latest.onrender.com/api/saved-filters?userId=${currentUser.id}`);
      setFilters(response.data);
    } catch (error) {
      console.error('Error fetching filters:', error);
      message.error('Failed to load filters');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFilter = () => {
    setEditingFilter(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditFilter = (filter: SavedFilter) => {
    setEditingFilter(filter);
    form.setFieldsValue({
      name: filter.name,
      description: filter.description,
      color: filter.color,
      isShared: filter.isShared,
    });
    setModalVisible(true);
  };

  const handleSaveFilter = async (values: any) => {
    try {
      if (editingFilter) {
        // Update existing filter
        await axios.put(`https://ayphen-pm-toll-latest.onrender.com/api/saved-filters/${editingFilter.id}`, values);
        message.success('Filter updated successfully');
      } else {
        // Create new filter
        await axios.post('https://ayphen-pm-toll-latest.onrender.com/api/saved-filters', {
          ...values,
          ownerId: currentUser?.id,
          filterConfig: {}, // Empty config for now, will be set when saving from FiltersView
        });
        message.success('Filter created successfully');
      }
      setModalVisible(false);
      fetchFilters();
    } catch (error) {
      console.error('Error saving filter:', error);
      message.error('Failed to save filter');
    }
  };

  const handleDeleteFilter = async (filterId: string) => {
    Modal.confirm({
      title: 'Delete Filter',
      content: 'Are you sure you want to delete this filter?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await axios.delete(`https://ayphen-pm-toll-latest.onrender.com/api/saved-filters/${filterId}`);
          message.success('Filter deleted');
          fetchFilters();
        } catch (error) {
          console.error('Error deleting filter:', error);
          message.error('Failed to delete filter');
        }
      },
    });
  };

  const handleStarFilter = async (filterId: string) => {
    try {
      await axios.post(`https://ayphen-pm-toll-latest.onrender.com/api/saved-filters/${filterId}/star`);
      fetchFilters();
    } catch (error) {
      console.error('Error starring filter:', error);
      message.error('Failed to star filter');
    }
  };

  const handleUseFilter = async (filter: SavedFilter) => {
    try {
      await axios.post(`https://ayphen-pm-toll-latest.onrender.com/api/saved-filters/${filter.id}/use`);
      // Navigate to filters view with this filter applied
      window.location.href = `/filters?savedFilter=${filter.id}`;
    } catch (error) {
      console.error('Error using filter:', error);
    }
  };

  const getFilterMenu = (filter: SavedFilter) => ({
    items: [
      {
        key: 'edit',
        label: 'Edit',
        icon: <Edit size={14} />,
        onClick: () => handleEditFilter(filter),
      },
      {
        key: 'share',
        label: filter.isShared ? 'Unshare' : 'Share',
        icon: <Share2 size={14} />,
        onClick: async () => {
          try {
            await axios.put(`https://ayphen-pm-toll-latest.onrender.com/api/saved-filters/${filter.id}`, {
              isShared: !filter.isShared,
            });
            message.success(filter.isShared ? 'Filter unshared' : 'Filter shared');
            fetchFilters();
          } catch (error) {
            message.error('Failed to update filter');
          }
        },
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: <Trash2 size={14} />,
        danger: true,
        onClick: () => handleDeleteFilter(filter.id),
      },
    ],
  });

  const favoriteFilters = filters.filter(f => f.isFavorite);
  const myFilters = filters.filter(f => f.ownerId === currentUser?.id && !f.isFavorite);
  const sharedFilters = filters.filter(f => f.ownerId !== currentUser?.id && f.isShared);

  return (
    <Container>
      <Header>
        <Title>Saved Filters</Title>
        <Button type="primary" icon={<Plus size={16} />} onClick={handleCreateFilter}>
          Create Filter
        </Button>
      </Header>

      {filters.length === 0 ? (
        <Card>
          <Empty
            description="No saved filters yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={handleCreateFilter}>
              Create Your First Filter
            </Button>
          </Empty>
        </Card>
      ) : (
        <>
          {favoriteFilters.length > 0 && (
            <>
              <h3 style={{ marginBottom: 16, color: colors.text.secondary }}>
                ⭐ Favorites
              </h3>
              {favoriteFilters.map(filter => (
                <FilterCard key={filter.id} onClick={() => handleUseFilter(filter)}>
                  <FilterHeader>
                    <FilterName>
                      {filter.color && <ColorDot color={filter.color} />}
                      <Filter size={16} />
                      {filter.name}
                      {filter.isStarred && <Star size={14} fill="#faad14" color="#faad14" />}
                    </FilterName>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Tooltip title="Star">
                        <Button
                          type="text"
                          size="small"
                          icon={<Star size={14} fill={filter.isStarred ? '#faad14' : 'none'} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStarFilter(filter.id);
                          }}
                        />
                      </Tooltip>
                      <Dropdown menu={getFilterMenu(filter)} trigger={['click']}>
                        <Button
                          type="text"
                          size="small"
                          icon={<MoreVertical size={14} />}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Dropdown>
                    </div>
                  </FilterHeader>
                  {filter.description && (
                    <FilterDescription>{filter.description}</FilterDescription>
                  )}
                  <FilterMeta>
                    <span>
                      <Clock size={12} style={{ marginRight: 4 }} />
                      Used {filter.usageCount} times
                    </span>
                    {filter.isShared && <Tag color="blue">Shared</Tag>}
                    {filter.lastUsedAt && (
                      <span>Last used: {new Date(filter.lastUsedAt).toLocaleDateString()}</span>
                    )}
                  </FilterMeta>
                </FilterCard>
              ))}
            </>
          )}

          {myFilters.length > 0 && (
            <>
              <h3 style={{ marginTop: 24, marginBottom: 16, color: colors.text.secondary }}>
                📁 My Filters
              </h3>
              {myFilters.map(filter => (
                <FilterCard key={filter.id} onClick={() => handleUseFilter(filter)}>
                  <FilterHeader>
                    <FilterName>
                      {filter.color && <ColorDot color={filter.color} />}
                      <Filter size={16} />
                      {filter.name}
                      {filter.isStarred && <Star size={14} fill="#faad14" color="#faad14" />}
                    </FilterName>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Tooltip title="Star">
                        <Button
                          type="text"
                          size="small"
                          icon={<Star size={14} fill={filter.isStarred ? '#faad14' : 'none'} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStarFilter(filter.id);
                          }}
                        />
                      </Tooltip>
                      <Dropdown menu={getFilterMenu(filter)} trigger={['click']}>
                        <Button
                          type="text"
                          size="small"
                          icon={<MoreVertical size={14} />}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Dropdown>
                    </div>
                  </FilterHeader>
                  {filter.description && (
                    <FilterDescription>{filter.description}</FilterDescription>
                  )}
                  <FilterMeta>
                    <span>
                      <Clock size={12} style={{ marginRight: 4 }} />
                      Used {filter.usageCount} times
                    </span>
                    {filter.isShared && <Tag color="blue">Shared</Tag>}
                    {filter.lastUsedAt && (
                      <span>Last used: {new Date(filter.lastUsedAt).toLocaleDateString()}</span>
                    )}
                  </FilterMeta>
                </FilterCard>
              ))}
            </>
          )}

          {sharedFilters.length > 0 && (
            <>
              <h3 style={{ marginTop: 24, marginBottom: 16, color: colors.text.secondary }}>
                🔗 Shared with Me
              </h3>
              {sharedFilters.map(filter => (
                <FilterCard key={filter.id} onClick={() => handleUseFilter(filter)}>
                  <FilterHeader>
                    <FilterName>
                      {filter.color && <ColorDot color={filter.color} />}
                      <Filter size={16} />
                      {filter.name}
                      {filter.isStarred && <Star size={14} fill="#faad14" color="#faad14" />}
                    </FilterName>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Tooltip title="Star">
                        <Button
                          type="text"
                          size="small"
                          icon={<Star size={14} fill={filter.isStarred ? '#faad14' : 'none'} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStarFilter(filter.id);
                          }}
                        />
                      </Tooltip>
                    </div>
                  </FilterHeader>
                  {filter.description && (
                    <FilterDescription>{filter.description}</FilterDescription>
                  )}
                  <FilterMeta>
                    <span>
                      <Clock size={12} style={{ marginRight: 4 }} />
                      Used {filter.usageCount} times
                    </span>
                    <Tag color="blue">Shared</Tag>
                  </FilterMeta>
                </FilterCard>
              ))}
            </>
          )}
        </>
      )}

      <Modal
        title={editingFilter ? 'Edit Filter' : 'Create Filter'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveFilter}>
          <Form.Item
            name="name"
            label="Filter Name"
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input placeholder="e.g., My Open Bugs" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Describe what this filter does" />
          </Form.Item>
          <Form.Item name="color" label="Color">
            <Select placeholder="Select a color">
              <Select.Option value="#1890ff">Blue</Select.Option>
              <Select.Option value="#52c41a">Green</Select.Option>
              <Select.Option value="#faad14">Orange</Select.Option>
              <Select.Option value="#f5222d">Red</Select.Option>
              <Select.Option value="#722ed1">Purple</Select.Option>
              <Select.Option value="#13c2c2">Cyan</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="isShared" label="Share with team" valuePropName="checked">
            <Input type="checkbox" />
          </Form.Item>
        </Form>
      </Modal>
    </Container>
  );
};

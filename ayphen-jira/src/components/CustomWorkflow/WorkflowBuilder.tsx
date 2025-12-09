import React, { useState } from 'react';
import { Card, Button, Modal, Form, Input, Select, message } from 'antd';
import ReactFlow, { Node, Edge, addEdge, Connection } from 'reactflow';
import 'reactflow/dist/style.css';
import styled from 'styled-components';

const Container = styled.div`
  height: 600px;
  background: white;
  border-radius: 8px;
`;

export const WorkflowBuilder: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([
    { id: '1', type: 'input', data: { label: 'Start' }, position: { x: 250, y: 0 } },
    { id: '2', data: { label: 'To Do' }, position: { x: 100, y: 100 } },
    { id: '3', data: { label: 'In Progress' }, position: { x: 250, y: 100 } },
    { id: '4', data: { label: 'Done' }, position: { x: 400, y: 100 } },
  ]);
  const [edges, setEdges] = useState<Edge[]>([
    { id: 'e1-2', source: '1', target: '2', animated: true },
  ]);
  const [modalVisible, setModalVisible] = useState(false);

  const onConnect = (params: Connection) => {
    setEdges((eds) => addEdge(params, eds));
  };

  const addStatus = () => {
    const newNode: Node = {
      id: `${nodes.length + 1}`,
      data: { label: 'New Status' },
      position: { x: Math.random() * 400, y: Math.random() * 400 },
    };
    setNodes([...nodes, newNode]);
  };

  const saveWorkflow = () => {
    message.success('Workflow saved successfully');
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button onClick={addStatus} style={{ marginRight: 8 }}>Add Status</Button>
        <Button onClick={() => setModalVisible(true)} style={{ marginRight: 8 }}>Add Rule</Button>
        <Button type="primary" onClick={saveWorkflow}>Save Workflow</Button>
      </div>
      
      <Container>
        <ReactFlow nodes={nodes} edges={edges} onConnect={onConnect} fitView />
      </Container>

      <Modal title="Add Workflow Rule" open={modalVisible} onCancel={() => setModalVisible(false)} footer={null}>
        <Form layout="vertical">
          <Form.Item label="Rule Name">
            <Input placeholder="e.g., Auto-assign to developer" />
          </Form.Item>
          <Form.Item label="Trigger">
            <Select placeholder="Select trigger">
              <Select.Option value="issue_created">Issue Created</Select.Option>
              <Select.Option value="status_changed">Status Changed</Select.Option>
            </Select>
          </Form.Item>
          <Button type="primary" block onClick={() => { message.success('Rule added'); setModalVisible(false); }}>
            Add Rule
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

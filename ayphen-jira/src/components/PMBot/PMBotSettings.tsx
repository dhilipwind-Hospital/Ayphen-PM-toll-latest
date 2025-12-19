import React, { useState } from 'react';
import styled from 'styled-components';
import { colors } from '../../theme/colors';
import { Settings, Bot, Save, RotateCcw } from 'lucide-react';
import { message } from 'antd';

const SettingsContainer = styled.div`
  background: ${colors.background.paper};
  border-radius: 12px;
  padding: 24px;
  max-width: 700px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid ${colors.border.default};
`;

const Title = styled.h3`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: ${colors.text.primary};
  display: flex;
  align-items: center;
  gap: 10px;
`;

const IconWrapper = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const SettingGroup = styled.div`
  margin-bottom: 24px;
`;

const SettingLabel = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: ${colors.text.primary};
  margin-bottom: 8px;
`;

const SettingDescription = styled.div`
  font-size: 12px;
  color: ${colors.text.secondary};
  margin-bottom: 12px;
`;

const SliderContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const Slider = styled.input`
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: ${colors.background.default};
  outline: none;
  -webkit-appearance: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    cursor: pointer;
    border: none;
  }
`;

const SliderValue = styled.div`
  min-width: 60px;
  text-align: right;
  font-weight: 600;
  color: ${colors.text.primary};
  font-size: 14px;
`;

const Toggle = styled.label`
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${colors.background.default};
    border: 2px solid ${colors.border.default};
    transition: 0.3s;
    border-radius: 24px;
    
    &:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 2px;
      bottom: 2px;
      background-color: ${colors.text.secondary};
      transition: 0.3s;
      border-radius: 50%;
    }
  }
  
  input:checked + span {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-color: transparent;
  }
  
  input:checked + span:before {
    transform: translateX(24px);
    background-color: white;
  }
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: ${colors.background.default};
  border-radius: 8px;
  margin-bottom: 8px;
`;

const ToggleLabel = styled.div`
  font-size: 14px;
  color: ${colors.text.primary};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 2px solid ${colors.border.default};
`;

const Button = styled.button<{ primary?: boolean }>`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  
  ${props => props.primary ? `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
  ` : `
    background: ${colors.background.default};
    color: ${colors.text.primary};
    border: 2px solid ${colors.border.default};
    
    &:hover {
      border-color: #667eea;
    }
  `}
`;

interface PMBotSettingsProps {
  projectId?: string;
  onSave?: (settings: any) => void;
}

export const PMBotSettings: React.FC<PMBotSettingsProps> = ({ projectId, onSave }) => {
  const [settings, setSettings] = useState({
    autoAssignEnabled: true,
    staleThresholdDays: 7,
    escalationThresholdDays: 14,
    maxWorkloadPoints: 25,
    autoTriageEnabled: true,
    staleSweepEnabled: true,
    notifyOnAssignment: true,
    notifyOnStale: true
  });

  const handleSave = () => {
    // Save to backend
    if (onSave) {
      onSave(settings);
    }
    message.success('PMBot settings saved successfully!');
  };

  const handleReset = () => {
    setSettings({
      autoAssignEnabled: true,
      staleThresholdDays: 7,
      escalationThresholdDays: 14,
      maxWorkloadPoints: 25,
      autoTriageEnabled: true,
      staleSweepEnabled: true,
      notifyOnAssignment: true,
      notifyOnStale: true
    });
  };

  return (
    <SettingsContainer>
      <Header>
        <IconWrapper>
          <Bot size={22} />
        </IconWrapper>
        <Title>
          <Settings size={20} />
          PMBot Configuration
        </Title>
      </Header>

      <SettingGroup>
        <SettingLabel>Auto-Assignment</SettingLabel>
        <SettingDescription>
          Automatically assign incoming issues to the best team member based on expertise and workload
        </SettingDescription>
        <ToggleContainer>
          <ToggleLabel>Enable Auto-Assignment</ToggleLabel>
          <Toggle>
            <input
              type="checkbox"
              checked={settings.autoAssignEnabled}
              onChange={(e) => setSettings({ ...settings, autoAssignEnabled: e.target.checked })}
            />
            <span></span>
          </Toggle>
        </ToggleContainer>
      </SettingGroup>

      <SettingGroup>
        <SettingLabel>Workload Capacity</SettingLabel>
        <SettingDescription>
          Maximum story points a team member can handle simultaneously
        </SettingDescription>
        <SliderContainer>
          <Slider
            type="range"
            min="10"
            max="50"
            value={settings.maxWorkloadPoints}
            onChange={(e) => setSettings({ ...settings, maxWorkloadPoints: parseInt(e.target.value) })}
          />
          <SliderValue>{settings.maxWorkloadPoints} points</SliderValue>
        </SliderContainer>
      </SettingGroup>

      <SettingGroup>
        <SettingLabel>Stale Issue Detection</SettingLabel>
        <SettingDescription>
          Number of days before an issue is considered stale and gets a reminder
        </SettingDescription>
        <SliderContainer>
          <Slider
            type="range"
            min="3"
            max="30"
            value={settings.staleThresholdDays}
            onChange={(e) => setSettings({ ...settings, staleThresholdDays: parseInt(e.target.value) })}
          />
          <SliderValue>{settings.staleThresholdDays} days</SliderValue>
        </SliderContainer>
      </SettingGroup>

      <SettingGroup>
        <SettingLabel>Escalation Threshold</SettingLabel>
        <SettingDescription>
          Number of days before a stale issue gets escalated with urgency
        </SettingDescription>
        <SliderContainer>
          <Slider
            type="range"
            min="7"
            max="60"
            value={settings.escalationThresholdDays}
            onChange={(e) => setSettings({ ...settings, escalationThresholdDays: parseInt(e.target.value) })}
          />
          <SliderValue>{settings.escalationThresholdDays} days</SliderValue>
        </SliderContainer>
      </SettingGroup>

      <SettingGroup>
        <SettingLabel>Additional Features</SettingLabel>
        <ToggleContainer>
          <ToggleLabel>Auto-Triage (labels & priority)</ToggleLabel>
          <Toggle>
            <input
              type="checkbox"
              checked={settings.autoTriageEnabled}
              onChange={(e) => setSettings({ ...settings, autoTriageEnabled: e.target.checked })}
            />
            <span></span>
          </Toggle>
        </ToggleContainer>

        <ToggleContainer>
          <ToggleLabel>Daily Stale Issue Sweep</ToggleLabel>
          <Toggle>
            <input
              type="checkbox"
              checked={settings.staleSweepEnabled}
              onChange={(e) => setSettings({ ...settings, staleSweepEnabled: e.target.checked })}
            />
            <span></span>
          </Toggle>
        </ToggleContainer>
      </SettingGroup>

      <SettingGroup>
        <SettingLabel>Notifications</SettingLabel>
        <ToggleContainer>
          <ToggleLabel>Notify on auto-assignment</ToggleLabel>
          <Toggle>
            <input
              type="checkbox"
              checked={settings.notifyOnAssignment}
              onChange={(e) => setSettings({ ...settings, notifyOnAssignment: e.target.checked })}
            />
            <span></span>
          </Toggle>
        </ToggleContainer>

        <ToggleContainer>
          <ToggleLabel>Notify on stale detection</ToggleLabel>
          <Toggle>
            <input
              type="checkbox"
              checked={settings.notifyOnStale}
              onChange={(e) => setSettings({ ...settings, notifyOnStale: e.target.checked })}
            />
            <span></span>
          </Toggle>
        </ToggleContainer>
      </SettingGroup>

      <ButtonGroup>
        <Button primary onClick={handleSave}>
          <Save size={16} />
          Save Settings
        </Button>
        <Button onClick={handleReset}>
          <RotateCcw size={16} />
          Reset to Defaults
        </Button>
      </ButtonGroup>
    </SettingsContainer>
  );
};

import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Input, Spin, message as antMessage } from 'antd';
import { Bot, Mic, Send, X } from 'lucide-react';
import axios from 'axios';
import { ENV } from '../../config/env';

const API_URL = ENV.API_URL;

const pulse = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.7); }
  50% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(14, 165, 233, 0); }
`;

const FloatingButton = styled.div<{ isOpen: boolean }>`
  position: fixed;
  bottom: 100px;
  right: 24px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #38BDF8, #0EA5E9);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(14, 165, 233, 0.4);
  animation: ${pulse} 2s infinite;
  z-index: 1000;
  transition: all 0.3s;

  &:hover {
    transform: scale(1.1);
  }

  ${props => props.isOpen && `
    animation: none;
    transform: scale(0.9);
  `}
`;

const ChatPanel = styled.div<{ isOpen: boolean }>`
  position: fixed;
  bottom: 170px;
  right: 24px;
  width: 400px;
  height: 600px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  flex-direction: column;
  z-index: 999;
  overflow: hidden;
`;

const ChatHeader = styled.div`
  padding: 20px;
  background: linear-gradient(135deg, #38BDF8, #0EA5E9);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ChatMessages = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Message = styled.div<{ isUser?: boolean }>`
  padding: 12px 16px;
  border-radius: 12px;
  max-width: 80%;
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  background: ${props => props.isUser ? 'linear-gradient(135deg, #38BDF8, #0EA5E9)' : '#f5f5f5'};
  color: ${props => props.isUser ? 'white' : '#000'};
`;

const ChatInput = styled.div`
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 8px;
`;

const IconButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #0EA5E9;
    color: white;
  }
`;

interface Message {
  text: string;
  isUser: boolean;
}

export const AICopilot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hi! I'm your AI assistant. Try:\n• 'Create a bug for login issue'\n• 'Create an epic for authentication'\n• 'Show me all bugs'\n• 'Find high priority issues'", isUser: false }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setInput('');
    setIsLoading(true);

    try {
      const userId = localStorage.getItem('userId') || '1c9d344e-14db-44ec-9dee-3ad8661a0ca0';
      const response = await axios.post(`${API_URL}/ai/copilot/chat`, {
        message: userMessage,
        userId
      }, { timeout: 10000 });

      setMessages(prev => [...prev, { text: response.data.response, isUser: false }]);

      if (response.data.action === 'issue_created') {
        antMessage.success(`✅ ${response.data.issueKey} created and auto-assigned!`);
      } else if (response.data.action === 'search') {
        antMessage.info(`Found ${response.data.results.length} results`);
      }
    } catch (error: any) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { text: error.message || 'Sorry, I encountered an error. Please try again.', isUser: false }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      antMessage.error('Voice input not supported in this browser');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      antMessage.info('🎤 Listening...');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      antMessage.error('Voice recognition failed');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <>
      <FloatingButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)}>
        <Bot size={28} color="white" />
      </FloatingButton>

      <ChatPanel isOpen={isOpen}>
        <ChatHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Bot size={24} />
            <div>
              <div style={{ fontWeight: 600 }}>AI Copilot</div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>Powered by Cerebras</div>
            </div>
          </div>
          <X size={20} style={{ cursor: 'pointer' }} onClick={() => setIsOpen(false)} />
        </ChatHeader>

        <ChatMessages>
          {messages.map((msg, idx) => (
            <Message key={idx} isUser={msg.isUser}>
              {msg.text}
            </Message>
          ))}
          {isLoading && (
            <Message isUser={false}>
              <Spin size="small" /> AI is thinking...
            </Message>
          )}
        </ChatMessages>

        <ChatInput>
          <IconButton onClick={handleVoiceInput} disabled={isListening}>
            <Mic size={20} color={isListening ? '#0EA5E9' : undefined} />
          </IconButton>
          <Input
            placeholder="Type or use voice..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onPressEnter={handleSend}
            style={{ flex: 1 }}
          />
          <IconButton onClick={handleSend}>
            <Send size={20} />
          </IconButton>
        </ChatInput>
      </ChatPanel>
    </>
  );
};

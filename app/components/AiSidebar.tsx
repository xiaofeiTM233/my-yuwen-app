'use client';

import { useState, useRef, useEffect } from 'react';
import { Button, Input, Space, Typography, Spin, message, Card, Modal } from 'antd';
import { RobotOutlined, SendOutlined, CloseOutlined, CheckOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Paragraph, Text } = Typography;
const { TextArea } = Input;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ToolCall {
  id: string;
  name: string;
  args: any;
  result: any;
}

interface AiSidebarProps {
  visible: boolean;
  onToggle: () => void;
  context?: any;
  onDataUpdate?: () => void;
}

export default function AiSidebar({ visible, onToggle, context, onDataUpdate }: AiSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingToolCall, setPendingToolCall] = useState<ToolCall | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (content?: string) => {
    const msg = content || input;
    if (!msg.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          context,
        }),
      });

      const result = await response.json();
      if (result.success) {
        if (result.toolCall) {
          const toolCall = result.toolCall;

          if (toolCall.name === 'update_wenyanwen' && toolCall.result.pendingApproval) {
            setPendingToolCall(toolCall);
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `📝 建议修改文言文数据\n\n修改原因：${toolCall.args.reason}\n\n请确认是否执行此修改。`,
            }]);
          } else if (toolCall.name === 'get_wenyanwen_list') {
            const list = toolCall.result.data?.map((item: any) =>
              `- ${item.meta.title}（${item.meta.author}）ID: ${item._id}`
            ).join('\n') || '暂无数据';
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `📚 文言文列表：\n\n${list}`,
            }]);
          } else if (toolCall.name === 'get_wenyanwen_detail') {
            const detail = toolCall.result.data;
            if (detail) {
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: `📖 ${detail.meta.title}\n作者：${detail.meta.author}\n教材：${detail.meta.book}\n\n共 ${detail.contents.length} 句`,
              }]);
            } else {
              setMessages(prev => [...prev, { role: 'assistant', content: '未找到该文言文' }]);
            }
          }
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: result.data }]);
        }
      } else {
        message.error(result.error || '请求失败');
      }
    } catch (error) {
      message.error('请求失败');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!pendingToolCall) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/wenyanwen/${pendingToolCall.args.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingToolCall.args.data),
      });

      const result = await response.json();
      if (result.success) {
        message.success('修改成功');
        setMessages(prev => [...prev, { role: 'assistant', content: '✅ 修改已执行成功！' }]);
        onDataUpdate?.();
      } else {
        message.error(result.error || '修改失败');
        setMessages(prev => [...prev, { role: 'assistant', content: `❌ 修改失败：${result.error}` }]);
      }
    } catch (error) {
      message.error('修改失败');
    } finally {
      setPendingToolCall(null);
      setLoading(false);
    }
  };

  const handleReject = () => {
    setPendingToolCall(null);
    setMessages(prev => [...prev, { role: 'assistant', content: '已取消修改。' }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <Button
        type="primary"
        icon={<RobotOutlined />}
        onClick={onToggle}
        style={{
          position: 'fixed',
          right: visible ? 400 : 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1001,
          borderRadius: '4px 0 0 4px',
          transition: 'right 0.3s',
        }}
      >
        {visible ? '' : 'AI'}
      </Button>

      <div style={{
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: 400,
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        borderLeft: '1px solid #f0f0f0',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
      }}>
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Space>
            <RobotOutlined />
            <span style={{ fontWeight: 'bold' }}>AI 助手</span>
          </Space>
          <Button type="text" size="small" icon={<CloseOutlined />} onClick={onToggle} />
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#999', marginTop: 50 }}>
              <RobotOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <div>你好！我是文言文助手</div>
              <div style={{ fontSize: 12, marginTop: 8 }}>可以问我关于文言文翻译、虚词用法等问题</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>也可以让我帮你修改文言文数据</div>
            </div>
          )}
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                marginBottom: 12,
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  backgroundColor: msg.role === 'user' ? '#1890ff' : '#f5f5f5',
                  color: msg.role === 'user' ? '#fff' : '#333',
                }}
              >
                <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</Paragraph>
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ textAlign: 'center', padding: 16 }}>
              <Spin />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {pendingToolCall && (
          <div style={{ padding: '8px 16px', borderTop: '1px solid #f0f0f0', backgroundColor: '#fffbe6' }}>
            <div style={{ marginBottom: 8 }}>
              <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
              <Text strong>确认修改？</Text>
            </div>
            <Space>
              <Button type="primary" size="small" icon={<CheckOutlined />} onClick={handleApprove} loading={loading}>
                确认
              </Button>
              <Button size="small" onClick={handleReject} disabled={loading}>
                取消
              </Button>
            </Space>
          </div>
        )}

        <div style={{ padding: 12, borderTop: '1px solid #f0f0f0' }}>
          <Space.Compact style={{ width: '100%' }}>
            <TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入问题..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              disabled={loading}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => handleSend()}
              loading={loading}
              disabled={!input.trim()}
            />
          </Space.Compact>
        </div>
      </div>
    </>
  );
}

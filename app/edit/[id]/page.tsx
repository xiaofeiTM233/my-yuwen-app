'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Space, message, Spin, Input, App, Tabs } from 'antd';
import { ArrowLeftOutlined, FormOutlined, CodeOutlined } from '@ant-design/icons';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import WenyanwenForm from '../../components/WenyanwenForm';

const { TextArea } = Input;

export default function EditPage() {
  const params = useParams();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [jsonValue, setJsonValue] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [activeTab, setActiveTab] = useState('form');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/wenyanwen/${params.id}`);
        const result = await response.json();
        if (result.success) {
          setData(result.data);
          setJsonValue(JSON.stringify({ meta: result.data.meta, contents: result.data.contents }, null, 2));
        }
      } catch (error) {
        message.error('获取数据失败');
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchData();
  }, [params.id]);

  const handleSubmit = async (formData: any) => {
    const response = await fetch(`/api/wenyanwen/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
  };

  const handleJsonSubmit = async () => {
    try {
      const parsed = JSON.parse(jsonValue);
      setJsonError('');
      const response = await fetch(`/api/wenyanwen/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const result = await response.json();
      if (result.success) {
        message.success('更新成功');
        setData({ ...data, ...parsed });
      } else {
        message.error(result.error || '更新失败');
      }
    } catch (e: any) {
      setJsonError(e.message);
      message.error('JSON 格式错误');
    }
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonValue(e.target.value);
    try {
      JSON.parse(e.target.value);
      setJsonError('');
    } catch (err: any) {
      setJsonError(err.message);
    }
  };

  if (loading) return <div style={{ padding: 24, textAlign: 'center' }}><Spin size="large" /></div>;
  if (!data) return <div style={{ padding: 24, textAlign: 'center' }}><Card><div>数据不存在</div><Link href="/"><Button style={{ marginTop: 16 }}>返回列表</Button></Link></Card></div>;

  const tabItems = [
    {
      key: 'form',
      label: <span><FormOutlined /> 表单编辑</span>,
      children: <WenyanwenForm initialData={{ meta: data.meta, contents: data.contents }} onSubmit={handleSubmit} isEdit={true} />,
    },
    {
      key: 'json',
      label: <span><CodeOutlined /> JSON 编辑</span>,
      children: (
        <div>
          <TextArea
            value={jsonValue}
            onChange={handleJsonChange}
            rows={30}
            style={{ fontFamily: 'monospace', fontSize: 13 }}
            status={jsonError ? 'error' : ''}
          />
          {jsonError && (
            <div style={{ color: '#ff4d4f', marginTop: 8, fontSize: 12 }}>
              JSON 错误: {jsonError}
            </div>
          )}
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Button type="primary" onClick={handleJsonSubmit} disabled={!!jsonError}>
              保存 JSON
            </Button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card title={<Space><Link href={`/detail/${params.id}`}><Button icon={<ArrowLeftOutlined />}>返回</Button></Link><span style={{ fontSize: 20, fontWeight: 'bold' }}>编辑文言文</span></Space>}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>
    </div>
  );
}

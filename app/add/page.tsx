'use client';

import { Card, Button, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';
import WenyanwenForm from '../components/WenyanwenForm';

export default function AddPage() {
  const handleSubmit = async (data: any) => {
    const response = await fetch('/api/wenyanwen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
  };

  return (
    <div style={{ padding: 24 }}>
      <Card title={<Space><Link href="/"><Button icon={<ArrowLeftOutlined />}>返回</Button></Link><span style={{ fontSize: 20, fontWeight: 'bold' }}>添加文言文</span></Space>}>
        <WenyanwenForm onSubmit={handleSubmit} />
      </Card>
    </div>
  );
}

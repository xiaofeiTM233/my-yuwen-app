'use client';

import { useEffect, useState } from 'react';
import { Button, App, Popconfirm, Space, Tag } from 'antd';
import ClientProTable from './components/ClientProTable';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Link from 'next/link';

interface WenyanwenItem {
  _id: string;
  meta: { author: string; title: string; book: string };
  contents: any[];
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WenyanwenItem[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchData = async (page = 1, pageSize = 10, keyword = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString(), keyword });
      const response = await fetch(`/api/wenyanwen?${params}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setPagination({ ...pagination, current: page, pageSize, total: result.pagination.total });
      }
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/wenyanwen/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        message.success('删除成功');
        fetchData(pagination.current, pagination.pageSize);
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleInitData = async () => {
    try {
      const response = await fetch('/api/init-data', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        message.success(result.message);
        fetchData();
      }
    } catch (error) {
      message.error('初始化失败');
    }
  };

  const columns: any[] = [
    {
      title: '标题', dataIndex: ['meta', 'title'], key: 'title',
      render: (text: any, record: any) => <Link href={`/detail/${record._id}`} style={{ color: '#1890ff' }}>{text}</Link>,
    },
    { title: '作者', dataIndex: ['meta', 'author'], key: 'author', width: 120 },
    { title: '教材', dataIndex: ['meta', 'book'], key: 'book', width: 200, render: (text: any) => <Tag color="blue">{text}</Tag> },
    { title: '句子数', key: 'sentenceCount', width: 100, render: (_: any, record: any) => record.contents?.length || 0 },
    {
      title: '操作', key: 'action', width: 200,
      render: (_: any, record: any) => (
        <Space>
          <Link href={`/detail/${record._id}`}><Button type="link" icon={<EyeOutlined />} size="small">查看</Button></Link>
          <Link href={`/edit/${record._id}`}><Button type="link" icon={<EditOutlined />} size="small">编辑</Button></Link>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record._id)}>
            <Button type="link" danger icon={<DeleteOutlined />} size="small">删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Space>
          <Button onClick={handleInitData}>初始化示例数据</Button>
          <Link href="/add"><Button type="primary" icon={<PlusOutlined />}>添加文言文</Button></Link>
        </Space>
      </div>
      <ClientProTable
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="_id"
        search={{ labelWidth: 'auto' }}
        request={async (params) => {
          const { current = 1, pageSize = 10, keyword = '' } = params;
          await fetchData(current, pageSize, keyword as string);
          return { data, total: pagination.total, success: true };
        }}
        pagination={{ ...pagination, showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 篇` }}
        headerTitle="文言文列表"
        options={{ density: true, fullScreen: true, reload: () => fetchData(pagination.current, pagination.pageSize), setting: true }}
      />
    </div>
  );
}

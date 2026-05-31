'use client';

import { useState } from 'react';
import { Card, Collapse, Tag, Input, Button, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { xuciData } from '@/lib/xuci-data';

const { Search } = Input;

const partOfSpeechColors: { [key: string]: string } = {
  '代词': 'blue',
  '助词': 'green',
  '连词': 'orange',
  '介词': 'purple',
  '副词': 'red',
  '动词': 'cyan',
  '语气': 'magenta',
};

export default function XuciPage() {
  const [keyword, setKeyword] = useState('');

  const filteredData = keyword
    ? xuciData.filter(item => item.word.includes(keyword))
    : xuciData;

  const collapseItems = filteredData.map((item, index) => ({
    key: item.word,
    label: (
      <span style={{ fontSize: 24, fontWeight: 'bold', fontFamily: 'serif' }}>
        {item.word}
        <Tag color="default" style={{ marginLeft: 8, fontSize: 12 }}>{item.usages.length} 种用法</Tag>
      </span>
    ),
    children: (
      <div>
        {item.usages.map((usage, usageIndex) => (
          <div key={usageIndex} style={{
            marginBottom: 16,
            padding: 16,
            backgroundColor: '#fafafa',
            borderRadius: 8,
            border: '1px solid #f0f0f0',
          }}>
            <Space style={{ marginBottom: 8 }}>
              <Tag color={partOfSpeechColors[usage.partOfSpeech] || 'default'}>{usage.partOfSpeech}</Tag>
              <span style={{ fontWeight: 'bold', fontSize: 16 }}>{usage.meaning}</span>
            </Space>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: '#666' }}>翻译：</span>
              <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{usage.translation}</span>
            </div>
            {usage.positionTip && (
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: '#666' }}>位置技巧：</span>
                <span>{usage.positionTip}</span>
              </div>
            )}
            {usage.warning && (
              <div style={{ marginBottom: 8 }}>
                <Tag color="warning">注意</Tag>
                <span style={{ color: '#faad14' }}>{usage.warning}</span>
              </div>
            )}
            {usage.example && (
              <div style={{ padding: '8px 12px', backgroundColor: '#fff', borderRadius: 4, border: '1px solid #e8e8e8' }}>
                <span style={{ color: '#666', fontSize: 12 }}>例句：</span>
                <span style={{ fontFamily: 'serif' }}>{usage.example}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    ),
  }));

  return (
    <div>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Search
          placeholder="搜索虚词"
          allowClear
          onSearch={(value) => setKeyword(value)}
          style={{ width: 300 }}
        />
      </div>
      <Collapse items={collapseItems} defaultActiveKey={filteredData.length > 0 ? [filteredData[0].word] : []} />
    </div>
  );
}

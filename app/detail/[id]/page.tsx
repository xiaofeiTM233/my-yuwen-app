'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Descriptions, Divider, message, Space, Tag, Tooltip, Typography } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const { Title } = Typography;

interface Pronunciation { index: number; pinyin: string; }
interface Translation { content: string; types: string[]; start: number; end: number; }
interface Content { origin: string; translations: Translation[]; pronunciations: Pronunciation[]; }
interface WenyanwenDetail {
  _id: string;
  meta: { author: string; title: string; book: string };
  contents: Content[];
  createdAt: string;
  updatedAt: string;
}

export default function DetailPage() {
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WenyanwenDetail | null>(null);
  const [hoveredRange, setHoveredRange] = useState<{ start: number; end: number } | null>(null);
  const [hoveredTransIndex, setHoveredTransIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/wenyanwen/${params.id}`);
        const result = await response.json();
        if (result.success) setData(result.data);
      } catch (error) {
        message.error('获取数据失败');
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchData();
  }, [params.id]);

  const renderSentenceWithPinyin = (sentence: Content, sentenceIndex: number) => {
    const chars = sentence.origin.split('');
    const pinyinMap: { [key: number]: string } = {};
    sentence.pronunciations.forEach((p) => { pinyinMap[p.index] = p.pinyin; });

    // 找出每个字符对应的翻译片段
    const charTranslationMap: { [key: number]: number[] } = {};
    sentence.translations.forEach((trans, transIndex) => {
      if (trans.start != null && trans.end != null) {
        for (let i = trans.start; i < trans.end; i++) {
          if (!charTranslationMap[i]) charTranslationMap[i] = [];
          charTranslationMap[i].push(transIndex);
        }
      }
    });

    const isCharHighlighted = (charIndex: number) => {
      if (hoveredRange === null) return false;
      return charIndex >= hoveredRange.start && charIndex < hoveredRange.end;
    };

    const isTransHighlighted = (transIndex: number) => {
      return hoveredTransIndex === transIndex;
    };

    return (
      <div key={sentenceIndex} style={{ marginBottom: 24, padding: 16, backgroundColor: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0' }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 8, fontSize: 12, color: '#666', fontWeight: 'bold' }}>原文</div>
          <div style={{ fontSize: 20, lineHeight: 2.5, fontFamily: 'serif' }}>
            {chars.map((char, charIndex) => {
              const relatedTransIndices = charTranslationMap[charIndex] || [];
              const highlighted = isCharHighlighted(charIndex);
              const tooltipContent = relatedTransIndices.length > 0 
                ? relatedTransIndices.map(i => {
                    const trans = sentence.translations[i];
                    return `${trans.content}${trans.types.length > 0 ? ` (${trans.types.join('、')})` : ''}`;
                  }).join('\n')
                : null;

              const charSpan = (
                <span
                  key={charIndex}
                  style={{
                    display: 'inline-block',
                    textAlign: 'center',
                    backgroundColor: highlighted ? '#ffe7ba' : 'transparent',
                    borderRadius: 2,
                    cursor: relatedTransIndices.length > 0 ? 'pointer' : 'default',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={() => {
                    if (relatedTransIndices.length > 0) {
                      const trans = sentence.translations[relatedTransIndices[0]];
                      setHoveredRange({ start: trans.start, end: trans.end });
                      setHoveredTransIndex(relatedTransIndices[0]);
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredRange(null);
                    setHoveredTransIndex(null);
                  }}
                >
                  {pinyinMap[charIndex] && <span style={{ display: 'block', fontSize: 12, color: '#1890ff', marginBottom: 2 }}>{pinyinMap[charIndex]}</span>}
                  <span style={{ display: 'block', minWidth: 24 }}>{char}</span>
                </span>
              );

              if (tooltipContent) {
                return <Tooltip key={charIndex} title={tooltipContent} placement="top">{charSpan}</Tooltip>;
              }
              return charSpan;
            })}
          </div>
        </div>
        <div style={{ borderTop: '1px dashed #d9d9d9', paddingTop: 12 }}>
          <div style={{ fontSize: 12, color: '#666', fontWeight: 'bold' }}>翻译</div>
          <div style={{ fontSize: 16, lineHeight: 2, color: '#333' }}>
            {sentence.translations.map((translation, transIndex) => {
              const highlighted = isTransHighlighted(transIndex);
              const tooltipContent = translation.types.length > 0 ? translation.types.join('、') : null;

              const transSpan = (
                <span
                  key={transIndex}
                  style={{
                    backgroundColor: highlighted ? '#ffe7ba' : 'transparent',
                    borderRadius: 2,
                    cursor: translation.start != null ? 'pointer' : 'default',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={() => {
                    if (translation.start != null && translation.end != null) {
                      setHoveredRange({ start: translation.start, end: translation.end });
                    }
                    setHoveredTransIndex(transIndex);
                  }}
                  onMouseLeave={() => {
                    setHoveredRange(null);
                    setHoveredTransIndex(null);
                  }}
                >
                  {translation.content}
                </span>
              );

              if (tooltipContent) {
                return <Tooltip key={transIndex} title={tooltipContent} placement="bottom">{transSpan}</Tooltip>;
              }
              return transSpan;
            })}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div style={{ padding: 24, textAlign: 'center' }}><Card loading={true} /></div>;
  if (!data) return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <Card><div>数据不存在</div><Link href="/"><Button style={{ marginTop: 16 }}>返回列表</Button></Link></Card>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <Card title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space><Link href="/"><Button icon={<ArrowLeftOutlined />}>返回</Button></Link><span style={{ fontSize: 20, fontWeight: 'bold' }}>{data.meta.title}</span></Space>
          <Link href={`/edit/${data._id}`}><Button type="primary" icon={<EditOutlined />}>编辑</Button></Link>
        </div>
      }>
        <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
          <Descriptions.Item label="标题">{data.meta.title}</Descriptions.Item>
          <Descriptions.Item label="作者">{data.meta.author}</Descriptions.Item>
          <Descriptions.Item label="教材" span={2}><Tag color="blue">{data.meta.book}</Tag></Descriptions.Item>
          <Descriptions.Item label="创建时间">{new Date(data.createdAt).toLocaleString('zh-CN')}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{new Date(data.updatedAt).toLocaleString('zh-CN')}</Descriptions.Item>
        </Descriptions>
        <Divider><Title level={4} style={{ margin: 0 }}>逐句对照</Title></Divider>
        <div style={{ marginTop: 16 }}>{data.contents.map((sentence, index) => renderSentenceWithPinyin(sentence, index))}</div>
      </Card>
    </div>
  );
}

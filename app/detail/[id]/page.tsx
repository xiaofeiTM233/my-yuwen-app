'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Collapse, Descriptions, Divider, message, Space, Tag, Tooltip, Typography } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import './detail.css';

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
      <div key={sentenceIndex} className="sentence-card">
        <div className="sentence-section">
          <div className="section-label">原文</div>
          <div className="original-text">
            {chars.map((char, charIndex) => {
              const relatedTransIndices = charTranslationMap[charIndex] || [];
              const highlighted = isCharHighlighted(charIndex);
              const tooltipContent = relatedTransIndices.length > 0 
                ? relatedTransIndices.map(i => {
                    const trans = sentence.translations[i];
                    return `${trans.content}${trans.types.length > 0 ? ` (${trans.types.join('、')})` : ''}`;
                  }).join('\n')
                : null;

              const charClass = `char-span ${relatedTransIndices.length > 0 ? 'has-translation' : 'no-translation'} ${highlighted ? 'highlighted' : ''}`;

              const charSpan = (
                <span
                  key={charIndex}
                  className={charClass}
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
                  {pinyinMap[charIndex] && <span className="pinyin">{pinyinMap[charIndex]}</span>}
                  <span className="char-text">{char}</span>
                </span>
              );

              if (tooltipContent) {
                return <Tooltip key={charIndex} title={tooltipContent} placement="top">{charSpan}</Tooltip>;
              }
              return charSpan;
            })}
          </div>
        </div>
        <div className="translation-divider">
          <div className="section-label">翻译</div>
          <div className="translation-text">
            {sentence.translations.map((translation, transIndex) => {
              const highlighted = isTransHighlighted(transIndex);
              const tooltipContent = translation.types.length > 0 ? translation.types.join('、') : null;

              const transClass = `trans-span ${translation.start != null ? 'has-range' : 'no-range'} ${highlighted ? 'highlighted' : ''}`;

              const transSpan = (
                <span
                  key={transIndex}
                  className={transClass}
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
        <Collapse
          size="small"
          style={{ marginTop: 12 }}
          items={[{
            key: 'data',
            label: <span style={{ fontSize: 12, color: '#999' }}>数据</span>,
            children: <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap' }}>{JSON.stringify(sentence, null, 2)}</pre>,
          }]}
        />
      </div>
    );
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 50 }}><Card loading={true} /></div>;
  if (!data) return <div style={{ textAlign: 'center', padding: 50 }}><Card>数据不存在</Card></div>;

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 20, fontWeight: 'bold' }}>{data.meta.title}</span>
        <Link href={`/edit/${data._id}`}><Button type="primary" icon={<EditOutlined />}>编辑</Button></Link>
      </div>
      <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="标题">{data.meta.title}</Descriptions.Item>
        <Descriptions.Item label="作者">{data.meta.author}</Descriptions.Item>
        <Descriptions.Item label="教材" span={2}><Tag color="blue">{data.meta.book}</Tag></Descriptions.Item>
      </Descriptions>
      <Divider><Title level={4} style={{ margin: 0 }}>逐句对照</Title></Divider>
      <div>{data.contents.map((sentence, index) => renderSentenceWithPinyin(sentence, index))}</div>
    </div>
  );
}

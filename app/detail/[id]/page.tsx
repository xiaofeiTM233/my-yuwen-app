'use client';

import { useEffect, useState } from 'react';
import { App, Button, Card, Collapse, Descriptions, Divider, Tag, Tooltip, Typography } from 'antd';
import { EditOutlined, CopyOutlined } from '@ant-design/icons';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import './detail.css';

const { Title } = Typography;

interface Pronunciation { index: number; pinyin: string; note?: string; }
interface Translation { content: string; types: string[]; start: number; end: number; note?: string; }
interface Content { origin: string; translations: Translation[]; pronunciations: Pronunciation[]; }
interface WenyanwenDetail {
  _id: string;
  meta: { author: string; title: string; book: string };
  contents: Content[];
  createdAt: string;
  updatedAt: string;
}

export default function DetailPage() {
  const { message } = App.useApp();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WenyanwenDetail | null>(null);
  const [hoveredRange, setHoveredRange] = useState<{ start: number; end: number } | null>(null);
  const [hoveredTransIndex, setHoveredTransIndex] = useState<number | null>(null);
  const [hoveredSentenceIndex, setHoveredSentenceIndex] = useState<number | null>(null);

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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success(`${label}已复制`);
    });
  };

  const renderSentenceWithPinyin = (sentence: Content, sentenceIndex: number) => {
    const chars = sentence.origin.split('');
    const pinyinMap: { [key: number]: string } = {};
    const pinyinNoteMap: { [key: number]: string } = {};
    sentence.pronunciations.forEach((p) => {
      pinyinMap[p.index] = p.pinyin;
      if (p.note) pinyinNoteMap[p.index] = p.note;
    });

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
      if (hoveredRange === null || hoveredSentenceIndex !== sentenceIndex) return false;
      return charIndex >= hoveredRange.start && charIndex < hoveredRange.end;
    };

    const isTransHighlighted = (transIndex: number) => {
      return hoveredTransIndex === transIndex && hoveredSentenceIndex === sentenceIndex;
    };

    return (
      <div key={sentenceIndex} className="sentence-card">
        <div className="sentence-section">
          <div className="section-label">
            原文
            <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(sentence.origin, '原文')} />
          </div>
          <div className="original-text">
            {chars.map((char, charIndex) => {
              const relatedTransIndices = charTranslationMap[charIndex] || [];
              const highlighted = isCharHighlighted(charIndex);
              
              // 鼠标在翻译上时，只让高亮范围的第一个字符显示 tooltip，其他字符不显示任何 tooltip
              // 鼠标在原文上或不在任何地方时，正常显示每个字符自己的翻译 tooltip
              const isHoveringTranslation = hoveredTransIndex !== null && hoveredSentenceIndex === sentenceIndex;
              const isFirstHighlightedChar = isHoveringTranslation &&
                hoveredRange && charIndex === hoveredRange.start;
              let tooltipContent: string | null = null;
              if (isHoveringTranslation) {
                // 鼠标在翻译上：仅第一个高亮字符显示 tooltip
                  if (isFirstHighlightedChar) {
                  const trans = sentence.translations[hoveredTransIndex];
                  tooltipContent = `${trans.content}${trans.types.length > 0 ? ` (${trans.types.join('、')})` : ''}${trans.note ? `\n说明：${trans.note}` : ''}`;
                }
                // 其他字符：tooltipContent 保持 null，不显示 tooltip
              } else {
                // 鼠标不在翻译上：正常显示每个字符对应的翻译 tooltip
                if (relatedTransIndices.length > 0) {
                  tooltipContent = relatedTransIndices.map(i => {
                    const trans = sentence.translations[i];
                    return `${trans.content}${trans.types.length > 0 ? ` (${trans.types.join('、')})` : ''}${trans.note ? `\n说明：${trans.note}` : ''}`;
                  }).join('\n');
                }
              }

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
                      setHoveredSentenceIndex(sentenceIndex);
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredRange(null);
                    setHoveredTransIndex(null);
                    setHoveredSentenceIndex(null);
                  }}
                >
                  {pinyinMap[charIndex] && (
                    pinyinNoteMap[charIndex] ? (
                      <Tooltip title={pinyinNoteMap[charIndex]} placement="top"><span className="pinyin" style={{ cursor: 'help', borderBottom: '1px dotted #999' }}>{pinyinMap[charIndex]}</span></Tooltip>
                    ) : (
                      <span className="pinyin">{pinyinMap[charIndex]}</span>
                    )
                  )}
                  <span className="char-text">{char}</span>
                </span>
              );

              if (tooltipContent) {
                return <Tooltip key={charIndex} title={tooltipContent} placement="top" open={isFirstHighlightedChar ? true : undefined}>{charSpan}</Tooltip>;
              }
              return charSpan;
            })}
          </div>
        </div>
        <div className="translation-divider">
          <div className="section-label">
            翻译
            <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(sentence.translations.map(t => t.content).join(''), '翻译')} />
          </div>
          <div className="translation-text">
            {sentence.translations.map((translation, transIndex) => {
              const highlighted = isTransHighlighted(transIndex);
              const tooltipContent = translation.types.length > 0 || translation.note
                ? [translation.types.length > 0 ? translation.types.join('、') : '', translation.note ? `说明：${translation.note}` : ''].filter(Boolean).join('\n')
                : null;

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
                    setHoveredSentenceIndex(sentenceIndex);
                  }}
                  onMouseLeave={() => {
                    setHoveredRange(null);
                    setHoveredTransIndex(null);
                    setHoveredSentenceIndex(null);
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
            label: (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span style={{ fontSize: 12, color: '#999' }}>数据</span>
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(JSON.stringify(sentence, null, 2), '数据');
                  }}
                />
              </div>
            ),
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

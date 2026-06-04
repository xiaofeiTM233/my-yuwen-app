'use client';

import { useEffect, useState } from 'react';
import { App, Button, Card, Collapse, Descriptions, Divider, Segmented, Tag, Tooltip, Typography } from 'antd';
import { EditOutlined, CopyOutlined, ReadOutlined, ColumnWidthOutlined, AlignLeftOutlined } from '@ant-design/icons';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import './detail.css';

const { Title } = Typography;

interface Pronunciation { index: number; pinyin: string; note?: string; }
interface Translation { content: string; types: string[]; start: number | null; end: number | null; note?: string; }
interface Content { origin: string | null; translations: Translation[]; pronunciations: Pronunciation[]; }
interface WenyanwenDetail {
  _id: string;
  meta: { author: string; title: string; book: string };
  contents: Content[];
  createdAt: string;
  updatedAt: string;
}

// 单条翻译 Tooltip（用于翻译区 hover）
function TransTooltip({ translations, indices }: { translations: Translation[]; indices: number[] }) {
  return (
    <>
      {indices.map((i, idx) => {
        const t = translations[i];
        return (
          <span key={i}>
            {idx > 0 && <br />}
            {t.content}{t.types.length > 0 && ` (${t.types.join('、')})`}
            {t.note && <><br />{t.note}</>}
          </span>
        );
      })}
    </>
  );
}

// 重叠译文合并 Tooltip（用于原文字符 hover，内容用……连接，types/notes 去重合并）
function MergedTransTooltip({ translations, indices }: { translations: Translation[]; indices: number[] }) {
  const contents = indices.map(i => translations[i].content).filter(Boolean);
  const allTypes = [...new Set(indices.flatMap(i => translations[i].types))];
  const allNotes = [...new Set(indices.map(i => translations[i].note).filter(Boolean))];
  return (
    <>
      <span>{contents.join('……')}</span>
      {allTypes.length > 0 && <><br />{allTypes.join('、')}</>}
      {allNotes.map((n, idx) => <span key={idx}><br />{n}</span>)}
    </>
  );
}

export default function DetailPage() {
  const { message } = App.useApp();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WenyanwenDetail | null>(null);
  const [hoveredRange, setHoveredRange] = useState<{ start: number; end: number } | null>(null);
  const [hoveredTransIndices, setHoveredTransIndices] = useState<number[]>([]);
  const [hoveredSentenceIndex, setHoveredSentenceIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<string>('sentence');

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
    // origin 为 null 表示分段标志
    if (sentence.origin === null) {
      return <div key={sentenceIndex} style={{ height: 16 }} />;
    }

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
      return hoveredSentenceIndex === sentenceIndex && hoveredTransIndices.includes(transIndex);
    };

    return (
      <div key={sentenceIndex} className="sentence-card">
        <div className="sentence-section">
          <div className="section-label">
            原文
            <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(sentence.origin ?? '', '原文')} />
          </div>
          <div className="original-text">
            {chars.map((char, charIndex) => {
              const relatedTransIndices = charTranslationMap[charIndex] || [];
              const highlighted = isCharHighlighted(charIndex);
              
              // 鼠标在翻译上时，高亮并集范围的第一个字符显示全部重叠译文 tooltip
              // 鼠标在原文上时，正常显示该字符覆盖的全部译文 tooltip
              const isHoveringTranslation = hoveredTransIndices.length > 0 && hoveredSentenceIndex === sentenceIndex;
              const isFirstHighlightedChar = isHoveringTranslation &&
                hoveredRange && charIndex === hoveredRange.start;
              const showTooltip = isHoveringTranslation ? isFirstHighlightedChar : relatedTransIndices.length > 0;
              const tooltipIndices = isHoveringTranslation && isFirstHighlightedChar ? hoveredTransIndices : relatedTransIndices;

              const charClass = `char-span ${relatedTransIndices.length > 0 ? 'has-translation' : 'no-translation'} ${highlighted ? 'highlighted' : ''}`;

              const charSpan = (
                <span
                  key={charIndex}
                  className={charClass}
                  onMouseEnter={() => {
                    if (relatedTransIndices.length > 0) {
                      const firstTrans = sentence.translations[relatedTransIndices[0]];
                      if (firstTrans.start != null && firstTrans.end != null) {
                        const unionStart = Math.min(...relatedTransIndices.map(i => sentence.translations[i].start!));
                        const unionEnd = Math.max(...relatedTransIndices.map(i => sentence.translations[i].end!));
                        setHoveredRange({ start: unionStart, end: unionEnd });
                      }
                      setHoveredTransIndices(relatedTransIndices);
                      setHoveredSentenceIndex(sentenceIndex);
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredRange(null);
                    setHoveredTransIndices([]);
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

              if (showTooltip) {
                return <Tooltip key={charIndex} title={<MergedTransTooltip translations={sentence.translations} indices={tooltipIndices} />} placement="top" open={isFirstHighlightedChar ? true : undefined}>{charSpan}</Tooltip>;
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
              const hasTooltip = translation.types.length > 0 || translation.note;

              const transClass = `trans-span ${translation.start != null ? 'has-range' : 'no-range'} ${highlighted ? 'highlighted' : ''}`;

              const transSpan = (
                <span
                  key={transIndex}
                  className={transClass}
                  onMouseEnter={() => {
                    if (translation.start != null && translation.end != null) {
                      // 计算所有与当前翻译范围重叠的翻译，并集高亮
                      const overlapping = sentence.translations
                        .map((t, i) => ({ t, i }))
                        .filter(({ t }) => t.start != null && t.end != null && t.start < translation.end! && t.end > translation.start!)
                        .map(({ i }) => i);
                      const unionStart = Math.min(...overlapping.map(i => sentence.translations[i].start!));
                      const unionEnd = Math.max(...overlapping.map(i => sentence.translations[i].end!));
                      setHoveredRange({ start: unionStart, end: unionEnd });
                      setHoveredTransIndices(overlapping);
                    }
                    setHoveredSentenceIndex(sentenceIndex);
                  }}
                  onMouseLeave={() => {
                    setHoveredRange(null);
                    setHoveredTransIndices([]);
                    setHoveredSentenceIndex(null);
                  }}
                >
                  {translation.content}
                </span>
              );

              if (hasTooltip) {
                // 找出与当前翻译重叠的所有翻译
                const overlapping = translation.start != null && translation.end != null
                  ? sentence.translations
                      .map((t, i) => ({ t, i }))
                      .filter(({ t }) => t.start != null && t.end != null && t.start < translation.end! && t.end > translation.start!)
                      .map(({ i }) => i)
                  : [transIndex];
                return <Tooltip key={transIndex} title={<MergedTransTooltip translations={sentence.translations} indices={overlapping} />} placement="bottom">{transSpan}</Tooltip>;
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

  // 获取单句的完整译文
  const getSentenceTranslation = (sentence: Content) =>
    sentence.translations.map(t => t.content ?? '').join('');

  // 按 origin=null 分段，返回 Content[][]
  const getParagraphs = (): Content[][] => {
    const paragraphs: Content[][] = [];
    let current: Content[] = [];
    for (const item of data!.contents) {
      if (item.origin === null) {
        if (current.length > 0) paragraphs.push(current);
        current = [];
      } else {
        current.push(item);
      }
    }
    if (current.length > 0) paragraphs.push(current);
    return paragraphs;
  };

  // 左右整段对照
  const renderParallelView = () => {
    const paragraphs = getParagraphs();

    // 渲染带拼音和翻译tooltip的原文字符
    const renderOriginalCharsWithPinyin = (sentence: Content, sentenceGlobalIndex: number) => {
      if (sentence.origin === null) return null;

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
        if (hoveredRange === null || hoveredSentenceIndex !== sentenceGlobalIndex) return false;
        return charIndex >= hoveredRange.start && charIndex < hoveredRange.end;
      };

      return chars.map((char, charIndex) => {
        const relatedTransIndices = charTranslationMap[charIndex] || [];
        const highlighted = isCharHighlighted(charIndex);

        const isHoveringTranslation = hoveredTransIndices.length > 0 && hoveredSentenceIndex === sentenceGlobalIndex;
        const isFirstHighlightedChar = isHoveringTranslation && hoveredRange && charIndex === hoveredRange.start;
        const showTooltip = isHoveringTranslation ? isFirstHighlightedChar : relatedTransIndices.length > 0;
        const tooltipIndices = isHoveringTranslation && isFirstHighlightedChar ? hoveredTransIndices : relatedTransIndices;

        const charClass = `char-span ${relatedTransIndices.length > 0 ? 'has-translation' : 'no-translation'} ${highlighted ? 'highlighted' : ''}`;

        const charSpan = (
          <span
            key={charIndex}
            className={charClass}
            onMouseEnter={() => {
              if (relatedTransIndices.length > 0) {
                const firstTrans = sentence.translations[relatedTransIndices[0]];
                if (firstTrans.start != null && firstTrans.end != null) {
                  // 计算所有相关翻译的范围并集
                  const unionStart = Math.min(...relatedTransIndices.map(i => sentence.translations[i].start!));
                  const unionEnd = Math.max(...relatedTransIndices.map(i => sentence.translations[i].end!));
                  setHoveredRange({ start: unionStart, end: unionEnd });
                }
                setHoveredTransIndices(relatedTransIndices);
                setHoveredSentenceIndex(sentenceGlobalIndex);
              }
            }}
            onMouseLeave={() => {
              setHoveredRange(null);
              setHoveredTransIndices([]);
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

        if (showTooltip) {
          return <Tooltip key={charIndex} title={<MergedTransTooltip translations={sentence.translations} indices={tooltipIndices} />} placement="top" open={isFirstHighlightedChar ? true : undefined}>{charSpan}</Tooltip>;
        }
        return charSpan;
      });
    };

    // 渲染带高亮联动的翻译文本
    const renderTranslationWithHighlight = (sentence: Content, sentenceGlobalIndex: number) => {
      const isTransHighlighted = (transIndex: number) => {
        return hoveredSentenceIndex === sentenceGlobalIndex && hoveredTransIndices.includes(transIndex);
      };

      return sentence.translations.map((translation, transIndex) => {
        const highlighted = isTransHighlighted(transIndex);
        const hasTooltip = translation.types.length > 0 || translation.note;

        const transClass = `trans-span ${translation.start != null ? 'has-range' : 'no-range'} ${highlighted ? 'highlighted' : ''}`;

        const transSpan = (
          <span
            key={transIndex}
            className={transClass}
            onMouseEnter={() => {
              if (translation.start != null && translation.end != null) {
                const overlapping = sentence.translations
                  .map((t, i) => ({ t, i }))
                  .filter(({ t }) => t.start != null && t.end != null && t.start < translation.end! && t.end > translation.start!)
                  .map(({ i }) => i);
                const unionStart = Math.min(...overlapping.map(i => sentence.translations[i].start!));
                const unionEnd = Math.max(...overlapping.map(i => sentence.translations[i].end!));
                setHoveredRange({ start: unionStart, end: unionEnd });
                setHoveredTransIndices(overlapping);
              }
              setHoveredSentenceIndex(sentenceGlobalIndex);
            }}
            onMouseLeave={() => {
              setHoveredRange(null);
              setHoveredTransIndices([]);
              setHoveredSentenceIndex(null);
            }}
          >
            {translation.content}
          </span>
        );

        if (hasTooltip) {
          const overlapping = translation.start != null && translation.end != null
            ? sentence.translations
                .map((t, i) => ({ t, i }))
                .filter(({ t }) => t.start != null && t.end != null && t.start < translation.end! && t.end > translation.start!)
                .map(({ i }) => i)
            : [transIndex];
          return <Tooltip key={transIndex} title={<MergedTransTooltip translations={sentence.translations} indices={overlapping} />} placement="bottom">{transSpan}</Tooltip>;
        }
        return transSpan;
      });
    };

    // 计算每个句子的全局索引
    let globalSentenceIndex = 0;
    const sentenceIndexMap: { [key: string]: number } = {};
    paragraphs.forEach((para, pi) => {
      para.forEach((s, si) => {
        sentenceIndexMap[`${pi}-${si}`] = globalSentenceIndex;
        globalSentenceIndex++;
      });
    });

    return (
      <div className="parallel-view">
        <div className="parallel-column">
          <div className="parallel-column-header">
            <span>原文</span>
            <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(paragraphs.map(p => p.map(s => s.origin).join('')).join('\n'), '原文')} />
          </div>
          <div className="parallel-column-body original-text">
            {paragraphs.map((para, pi) => (
              <div key={pi} className="paragraph-block">
                {para.map((s, si) => (
                  <span key={si} className="sentence-in-paragraph">
                    {renderOriginalCharsWithPinyin(s, sentenceIndexMap[`${pi}-${si}`])}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="parallel-divider" />
        <div className="parallel-column">
          <div className="parallel-column-header">
            <span>译文</span>
            <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(paragraphs.map(p => p.map(s => getSentenceTranslation(s)).join('')).join('\n'), '译文')} />
          </div>
          <div className="parallel-column-body translation-text">
            {paragraphs.map((para, pi) => (
              <div key={pi} className="paragraph-block">
                {para.map((s, si) => (
                  <span key={si} className="sentence-in-paragraph">
                    {renderTranslationWithHighlight(s, sentenceIndexMap[`${pi}-${si}`])}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 逐段对照
  const renderParagraphView = () => {
    const paragraphs = getParagraphs();

    // 渲染带拼音和翻译tooltip的原文字符
    const renderOriginalCharsWithPinyin = (sentence: Content, sentenceGlobalIndex: number) => {
      if (sentence.origin === null) return null;

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
        if (hoveredRange === null || hoveredSentenceIndex !== sentenceGlobalIndex) return false;
        return charIndex >= hoveredRange.start && charIndex < hoveredRange.end;
      };

      return chars.map((char, charIndex) => {
        const relatedTransIndices = charTranslationMap[charIndex] || [];
        const highlighted = isCharHighlighted(charIndex);

        const isHoveringTranslation = hoveredTransIndices.length > 0 && hoveredSentenceIndex === sentenceGlobalIndex;
        const isFirstHighlightedChar = isHoveringTranslation && hoveredRange && charIndex === hoveredRange.start;
        const showTooltip = isHoveringTranslation ? isFirstHighlightedChar : relatedTransIndices.length > 0;
        const tooltipIndices = isHoveringTranslation && isFirstHighlightedChar ? hoveredTransIndices : relatedTransIndices;

        const charClass = `char-span ${relatedTransIndices.length > 0 ? 'has-translation' : 'no-translation'} ${highlighted ? 'highlighted' : ''}`;

        const charSpan = (
          <span
            key={charIndex}
            className={charClass}
            onMouseEnter={() => {
              if (relatedTransIndices.length > 0) {
                const firstTrans = sentence.translations[relatedTransIndices[0]];
                if (firstTrans.start != null && firstTrans.end != null) {
                  const unionStart = Math.min(...relatedTransIndices.map(i => sentence.translations[i].start!));
                  const unionEnd = Math.max(...relatedTransIndices.map(i => sentence.translations[i].end!));
                  setHoveredRange({ start: unionStart, end: unionEnd });
                }
                setHoveredTransIndices(relatedTransIndices);
                setHoveredSentenceIndex(sentenceGlobalIndex);
              }
            }}
            onMouseLeave={() => {
              setHoveredRange(null);
              setHoveredTransIndices([]);
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

        if (showTooltip) {
          return <Tooltip key={charIndex} title={<MergedTransTooltip translations={sentence.translations} indices={tooltipIndices} />} placement="top" open={isFirstHighlightedChar ? true : undefined}>{charSpan}</Tooltip>;
        }
        return charSpan;
      });
    };

    // 渲染带高亮联动的翻译文本
    const renderTranslationWithHighlight = (sentence: Content, sentenceGlobalIndex: number) => {
      const isTransHighlighted = (transIndex: number) => {
        return hoveredSentenceIndex === sentenceGlobalIndex && hoveredTransIndices.includes(transIndex);
      };

      return sentence.translations.map((translation, transIndex) => {
        const highlighted = isTransHighlighted(transIndex);
        const hasTooltip = translation.types.length > 0 || translation.note;

        const transClass = `trans-span ${translation.start != null ? 'has-range' : 'no-range'} ${highlighted ? 'highlighted' : ''}`;

        const transSpan = (
          <span
            key={transIndex}
            className={transClass}
            onMouseEnter={() => {
              if (translation.start != null && translation.end != null) {
                const overlapping = sentence.translations
                  .map((t, i) => ({ t, i }))
                  .filter(({ t }) => t.start != null && t.end != null && t.start < translation.end! && t.end > translation.start!)
                  .map(({ i }) => i);
                const unionStart = Math.min(...overlapping.map(i => sentence.translations[i].start!));
                const unionEnd = Math.max(...overlapping.map(i => sentence.translations[i].end!));
                setHoveredRange({ start: unionStart, end: unionEnd });
                setHoveredTransIndices(overlapping);
              }
              setHoveredSentenceIndex(sentenceGlobalIndex);
            }}
            onMouseLeave={() => {
              setHoveredRange(null);
              setHoveredTransIndices([]);
              setHoveredSentenceIndex(null);
            }}
          >
            {translation.content}
          </span>
        );

        if (hasTooltip) {
          const overlapping = translation.start != null && translation.end != null
            ? sentence.translations
                .map((t, i) => ({ t, i }))
                .filter(({ t }) => t.start != null && t.end != null && t.start < translation.end! && t.end > translation.start!)
                .map(({ i }) => i)
            : [transIndex];
          return <Tooltip key={transIndex} title={<MergedTransTooltip translations={sentence.translations} indices={overlapping} />} placement="bottom">{transSpan}</Tooltip>;
        }
        return transSpan;
      });
    };

    // 计算每个句子的全局索引
    let globalSentenceIndex = 0;
    const sentenceIndexMap: { [key: string]: number } = {};
    paragraphs.forEach((para, pi) => {
      para.forEach((s, si) => {
        sentenceIndexMap[`${pi}-${si}`] = globalSentenceIndex;
        globalSentenceIndex++;
      });
    });

    return (
      <div className="paragraph-view">
        {paragraphs.map((para, pi) => {
          const origText = para.map(s => s.origin).join('');
          const transText = para.map(s => getSentenceTranslation(s)).join('');
          return (
            <div key={pi} className="paragraph-card">
              <div className="paragraph-original">
                <div className="section-label">
                  原文
                  <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(origText, '原文')} />
                </div>
                <div className="original-text">
                  {para.map((s, si) => (
                    <span key={si} className="sentence-in-paragraph">
                      {renderOriginalCharsWithPinyin(s, sentenceIndexMap[`${pi}-${si}`])}
                    </span>
                  ))}
                </div>
              </div>
              <div className="paragraph-translation">
                <div className="section-label">
                  译文
                  <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(transText, '译文')} />
                </div>
                <div className="translation-text">
                  {para.map((s, si) => (
                    <span key={si} className="sentence-in-paragraph">
                      {renderTranslationWithHighlight(s, sentenceIndexMap[`${pi}-${si}`])}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
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
      <Divider>
        <Segmented
          value={viewMode}
          onChange={(val) => setViewMode(val as string)}
          options={[
            { label: '逐句对照', value: 'sentence', icon: <ReadOutlined /> },
            { label: '逐段对照', value: 'paragraph', icon: <AlignLeftOutlined /> },
            { label: '左右对照', value: 'parallel', icon: <ColumnWidthOutlined /> },
          ]}
        />
      </Divider>
      {viewMode === 'sentence' && (
        <div>{data.contents.map((sentence, index) => renderSentenceWithPinyin(sentence, index))}</div>
      )}
      {viewMode === 'parallel' && renderParallelView()}
      {viewMode === 'paragraph' && renderParagraphView()}
    </div>
  );
}

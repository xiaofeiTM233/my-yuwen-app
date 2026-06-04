'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Collapse, Form, Input, Space, message, Select, InputNumber, Table } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

interface WenyanwenFormData {
  meta: { author: string; title: string; book: string };
  contents: any[];
}

interface WenyanwenFormProps {
  initialData?: WenyanwenFormData;
  onSubmit: (data: WenyanwenFormData) => Promise<void>;
  isEdit?: boolean;
}

const translationTypes = ['直译', '意译', '注释', '赏析'];

export default function WenyanwenForm({ initialData, onSubmit, isEdit = false }: WenyanwenFormProps) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (initialData) form.setFieldsValue(initialData); }, [initialData, form]);

  const handleSubmit = async (values: WenyanwenFormData) => {
    setLoading(true);
    try {
      // 空 origin 转为 null（分段标志）
      values.contents.forEach((c: any) => {
        if (c.origin === '' || c.origin === undefined) c.origin = null;
      });
      await onSubmit(values);
      message.success(isEdit ? '更新成功' : '添加成功');
      router.push('/');
    } catch (error) {
      message.error(isEdit ? '更新失败' : '添加失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}
      initialValues={{ meta: { author: '', title: '', book: '' }, contents: [{ origin: '', translations: [{ content: '', types: ['直译'], start: 0, end: 0 }], pronunciations: [] }] }}>
      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Form.Item name={['meta', 'title']} label="标题" rules={[{ required: true, message: '请输入标题' }]}><Input placeholder="请输入文言文标题" /></Form.Item>
        <Form.Item name={['meta', 'author']} label="作者" rules={[{ required: true, message: '请输入作者' }]}><Input placeholder="请输入作者" /></Form.Item>
        <Form.Item name={['meta', 'book']} label="教材" rules={[{ required: true, message: '请输入教材' }]}><Input placeholder="如：高中语文必修上册" /></Form.Item>
      </Card>

      <Card title="内容">
        <Form.List name="contents">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => (
                <Card key={field.key} size="small" title={`句子 ${index + 1}`}
                  extra={fields.length > 1 && <Button type="link" danger icon={<MinusCircleOutlined />} onClick={() => remove(field.name)}>删除句子</Button>}
                  style={{ marginBottom: 16 }}>
                  <Form.Item name={[field.name, 'origin']} label="原文" extra="留空表示分段标志"><Input.TextArea rows={2} /></Form.Item>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12, alignItems: 'start' }}>
                    <Form.List name={[field.name, 'translations']}>
                      {(transFields, { add: addTrans, remove: removeTrans }) => (
                        <Collapse
                          size="small"
                          items={[{
                            key: 'trans',
                            label: `翻译 (${transFields.length})`,
                            children: (
                              <>
                                <Table
                                  size="small"
                                  pagination={false}
                                  dataSource={transFields}
                                  rowKey="key"
                                  columns={[
                                    { title: '翻译内容', dataIndex: 'content', width: 150, render: (_, __, i) => <Form.Item name={[i, 'content']} rules={[{ required: true }]} noStyle><Input.TextArea autoSize style={{ minHeight: 15 }} /></Form.Item> },
                                    { title: '类型', dataIndex: 'types', width: 180, render: (_, __, i) => <Form.Item name={[i, 'types']} noStyle><Select mode="multiple" options={translationTypes.map(t => ({ label: t, value: t }))} style={{ width: '100%' }} /></Form.Item> },
                                    { title: '起始', dataIndex: 'start', width: 80, render: (_, __, i) => <Form.Item name={[i, 'start']} noStyle><InputNumber min={0} style={{ width: '100%' }} /></Form.Item> },
                                    { title: '结束', dataIndex: 'end', width: 80, render: (_, __, i) => <Form.Item name={[i, 'end']} noStyle><InputNumber min={0} style={{ width: '100%' }} /></Form.Item> },
                                    { title: '说明', dataIndex: 'note', render: (_, __, i) => <Form.Item name={[i, 'note']} noStyle><Input placeholder="可选" /></Form.Item> },
                                    { title: '', width: 48, render: (_, __, i) => <MinusCircleOutlined style={{ color: '#ff4d4f' }} onClick={() => removeTrans(i)} /> },
                                  ]}
                                  style={{ marginBottom: 8 }}
                                />
                                <Button type="dashed" onClick={() => addTrans()} icon={<PlusOutlined />} style={{ width: '100%' }}>添加翻译</Button>
                              </>
                            ),
                          }]}
                        />
                      )}
                    </Form.List>
                    <Form.List name={[field.name, 'pronunciations']}>
                      {(pronFields, { add: addPron, remove: removePron }) => (
                        <Collapse
                          size="small"
                          items={[{
                            key: 'pron',
                            label: `注音 (${pronFields.length})`,
                            children: (
                              <>
                                <Table
                                  size="small"
                                  pagination={false}
                                  dataSource={pronFields}
                                  rowKey="key"
                                  columns={[
                                    { title: '索引', dataIndex: 'index', width: 70, render: (_, __, i) => <Form.Item name={[i, 'index']} rules={[{ required: true }]} noStyle><InputNumber placeholder="索引" min={0} style={{ width: '100%' }} /></Form.Item> },
                                    { title: '拼音', dataIndex: 'pinyin', width: 100, render: (_, __, i) => <Form.Item name={[i, 'pinyin']} rules={[{ required: true }]} noStyle><Input placeholder="拼音" /></Form.Item> },
                                    { title: '说明', dataIndex: 'note', render: (_, __, i) => <Form.Item name={[i, 'note']} noStyle><Input placeholder="可选" /></Form.Item> },
                                    { title: '', width: 36, render: (_, __, i) => <MinusCircleOutlined style={{ color: '#ff4d4f' }} onClick={() => removePron(i)} /> },
                                  ]}
                                  style={{ marginBottom: 8 }}
                                />
                                <Button type="dashed" onClick={() => addPron()} icon={<PlusOutlined />} style={{ width: '100%' }}>添加注音</Button>
                              </>
                            ),
                          }]}
                        />
                      )}
                    </Form.List>
                  </div>
                </Card>
              ))}
              <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} style={{ width: '100%' }}>添加句子</Button>
            </>
          )}
        </Form.List>
      </Card>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Space><Button onClick={() => router.push('/')}>取消</Button><Button type="primary" htmlType="submit" loading={loading}>{isEdit ? '更新' : '添加'}</Button></Space>
      </div>
    </Form>
  );
}

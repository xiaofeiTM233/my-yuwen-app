'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Form, Input, Space, message, Divider, Select, InputNumber } from 'antd';
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
                  <Form.Item name={[field.name, 'origin']} label="原文" rules={[{ required: true, message: '请输入原文' }]}><Input.TextArea rows={2} /></Form.Item>
                  <Divider>注音</Divider>
                  <Form.List name={[field.name, 'pronunciations']}>
                    {(pronFields, { add: addPron, remove: removePron }) => (
                      <>
                        {pronFields.map((pronField) => (
                          <Space key={pronField.key} align="baseline" style={{ marginBottom: 8 }}>
                            <Form.Item name={[pronField.name, 'index']} rules={[{ required: true }]}><InputNumber placeholder="字索引" min={0} style={{ width: 100 }} /></Form.Item>
                            <Form.Item name={[pronField.name, 'pinyin']} rules={[{ required: true }]}><Input placeholder="拼音" style={{ width: 120 }} /></Form.Item>
                            <Form.Item name={[pronField.name, 'note']}><Input placeholder="说明（可选）" style={{ width: 160 }} /></Form.Item>
                            <MinusCircleOutlined onClick={() => removePron(pronField.name)} />
                          </Space>
                        ))}
                        <Button type="dashed" onClick={() => addPron()} icon={<PlusOutlined />} style={{ width: '100%' }}>添加注音</Button>
                      </>
                    )}
                  </Form.List>
                  <Divider>翻译</Divider>
                  <Form.List name={[field.name, 'translations']}>
                    {(transFields, { add: addTrans, remove: removeTrans }) => (
                      <>
                        {transFields.map((transField) => (
                          <Card key={transField.key} size="small" style={{ marginBottom: 8 }}
                            extra={transFields.length > 1 && <Button type="link" danger icon={<MinusCircleOutlined />} onClick={() => removeTrans(transField.name)} size="small">删除</Button>}>
                            <Form.Item name={[transField.name, 'content']} label="翻译内容" rules={[{ required: true }]}><Input.TextArea rows={2} /></Form.Item>
                            <Form.Item name={[transField.name, 'types']} label="翻译类型" rules={[{ required: true }]}>
                              <Select mode="multiple" options={translationTypes.map((type) => ({ label: type, value: type }))} />
                            </Form.Item>
                            <Space>
                              <Form.Item name={[transField.name, 'start']} label="起始位置"><InputNumber min={0} style={{ width: 100 }} /></Form.Item>
                              <Form.Item name={[transField.name, 'end']} label="结束位置"><InputNumber min={0} style={{ width: 100 }} /></Form.Item>
                            </Space>
                            <Form.Item name={[transField.name, 'note']} label="说明"><Input placeholder="说明（可选）" /></Form.Item>
                          </Card>
                        ))}
                        <Button type="dashed" onClick={() => addTrans()} icon={<PlusOutlined />} style={{ width: '100%' }}>添加翻译</Button>
                      </>
                    )}
                  </Form.List>
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

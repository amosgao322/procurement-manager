import { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Space, Select } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { supplierApi } from '@/services/api';
import type { Supplier } from '@/types';

// 供应商信用评级列表
const SUPPLIER_RATINGS = [
  { label: '优秀', value: '优秀' },
  { label: '良好', value: '良好' },
  { label: '一般', value: '一般' },
  { label: '较差', value: '较差' },
  { label: '差', value: '差' },
];

const SupplierForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = id && id !== 'new';

  useEffect(() => {
    if (isEdit) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id || id === 'new') return;
    try {
      const data = await supplierApi.getById(Number(id));
      form.setFieldsValue(data);
    } catch (error) {
      message.error('加载供应商信息失败');
    }
  };

  const onFinish = async (values: Supplier) => {
    setLoading(true);
    try {
      if (isEdit) {
        await supplierApi.update(Number(id!), values);
        message.success('更新成功');
      } else {
        await supplierApi.create(values);
        message.success('创建成功');
      }
      navigate('/suppliers');
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={isEdit ? '编辑供应商' : '新建供应商'}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          label="编码"
          name="code"
          rules={[{ required: true, message: '请输入供应商编码' }]}
        >
          <Input placeholder="供应商编码" disabled={!!isEdit} />
        </Form.Item>

        <Form.Item
          label="名称"
          name="name"
          rules={[{ required: true, message: '请输入供应商名称' }]}
        >
          <Input placeholder="供应商名称" />
        </Form.Item>

        <Form.Item label="联系人" name="contact_person">
          <Input placeholder="联系人" />
        </Form.Item>

        <Form.Item label="联系电话" name="contact_phone">
          <Input placeholder="联系电话" />
        </Form.Item>

        <Form.Item label="联系邮箱" name="contact_email">
          <Input type="email" placeholder="联系邮箱" />
        </Form.Item>

        <Form.Item label="地址" name="address">
          <Input.TextArea rows={2} placeholder="地址" />
        </Form.Item>

        <Form.Item label="税号" name="tax_id">
          <Input placeholder="税号" />
        </Form.Item>

        <Form.Item label="开户银行" name="bank_name">
          <Input placeholder="开户银行" />
        </Form.Item>

        <Form.Item label="银行账号" name="bank_account">
          <Input placeholder="银行账号" />
        </Form.Item>

        <Form.Item label="信用等级" name="credit_rating">
          <Select placeholder="请选择信用等级" allowClear>
            {SUPPLIER_RATINGS.map((rating) => (
              <Select.Option key={rating.value} value={rating.value}>
                {rating.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="备注" name="remark">
          <Input.TextArea rows={3} placeholder="备注" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEdit ? '更新' : '创建'}
            </Button>
            <Button onClick={() => navigate('/suppliers')}>
              取消
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default SupplierForm;


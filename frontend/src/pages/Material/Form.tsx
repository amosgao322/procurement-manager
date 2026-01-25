import { useState, useEffect } from 'react';
import { Form, Input, Button, Modal, message, Space, Select, InputNumber, Row, Col, Switch, AutoComplete } from 'antd';
import { materialApi, supplierApi } from '@/services/api';
import type { Material, MaterialPriceStatus } from '@/types';

const { Option } = Select;

const PRICE_STATUS_OPTIONS: Array<{ label: string; value: MaterialPriceStatus }> = [
  { label: '待确认', value: 'pending' },
  { label: '有效', value: 'valid' },
  { label: '无效', value: 'expired' },
  { label: '异常', value: 'abnormal' },
];

const CURRENCY_OPTIONS = [
  { label: 'CNY (人民币)', value: 'CNY' },
  { label: 'USD (美元)', value: 'USD' },
  { label: 'EUR (欧元)', value: 'EUR' },
];

interface MaterialFormModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
  materialId?: number;
}

const MaterialFormModal: React.FC<MaterialFormModalProps> = ({ open, onCancel, onSuccess, materialId }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [supplierOptions, setSupplierOptions] = useState<Array<{ value: string; label: string }>>([]);
  const isEdit = !!materialId;

  useEffect(() => {
    if (open) {
      loadSuppliers();
      if (isEdit && materialId) {
        loadData();
      } else {
        // 新建时设置默认值
        form.resetFields();
        form.setFieldsValue({
          price_status: 'pending',
          currency: 'CNY',
          is_active: true,
        });
      }
    }
  }, [open, materialId]);

  const loadSuppliers = async () => {
    try {
      const response = await supplierApi.getList({ page: 1, page_size: 1000 });
      setSupplierOptions(
        response.items.map((s) => ({
          value: s.name || '',
          label: s.name || '',
        }))
      );
    } catch (error) {
      console.error('加载供应商列表失败', error);
    }
  };

  const loadData = async () => {
    if (!materialId) return;
    try {
      const data = await materialApi.getById(materialId);
      form.setFieldsValue(data);
    } catch (error) {
      message.error('加载物料信息失败');
    }
  };

  const onFinish = async (values: Material) => {
    setLoading(true);
    try {
      if (isEdit && materialId) {
        await materialApi.update(materialId, values);
        message.success('更新成功');
      } else {
        await materialApi.create(values);
        message.success('创建成功');
      }
      form.resetFields();
      onSuccess?.();
      onCancel();
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={isEdit ? '编辑物料' : '新建物料'}
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={800}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
        style={{ marginTop: 20 }}
      >
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              label="物料编码"
              name="code"
              tooltip="留空将自动生成编码（格式：M日期-序号，如：M20250101-001）"
            >
              <Input placeholder="留空自动生成" disabled={isEdit} size="small" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="物料名称"
              name="name"
              rules={[{ required: true, message: '请输入物料名称' }]}
            >
              <Input placeholder="物料名称" size="small" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item label="规格型号" name="specification">
              <Input placeholder="规格型号" size="small" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="单位" name="unit">
              <Input placeholder="单位（如：个、kg、m）" size="small" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item label="物料类别" name="category">
              <Input placeholder="物料类别" size="small" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="品牌" name="brand">
              <Input placeholder="品牌" size="small" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col span={8}>
            <Form.Item label="价格状态" name="price_status">
              <Select placeholder="请选择" size="small">
                {PRICE_STATUS_OPTIONS.map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="币种" name="currency">
              <Select placeholder="请选择" size="small">
                {CURRENCY_OPTIONS.map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="最近价格" name="last_price">
              <InputNumber
                placeholder="最近价格"
                min={0}
                precision={4}
                style={{ width: '100%' }}
                size="small"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item label="物料来源" name="source">
              <AutoComplete
                options={supplierOptions}
                placeholder="选择供应商或手动输入"
                filterOption={(inputValue, option) =>
                  option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                }
                allowClear
                size="small"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="启用状态" name="is_active" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="停用" size="small" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="状态原因" name="status_reason">
          <Input.TextArea rows={2} placeholder="当价格状态为异常或过期时，可填写原因" size="small" />
        </Form.Item>

        <Form.Item label="备注" name="remark">
          <Input.TextArea rows={2} placeholder="备注" size="small" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={handleCancel}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEdit ? '更新' : '创建'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default MaterialFormModal;


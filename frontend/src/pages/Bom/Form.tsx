import { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Button, Card, message, Space, Table, Select } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { bomApi } from '@/services/api';
import type { Bom, BomItem } from '@/types';

const BomForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<BomItem[]>([]);
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
      const data = await bomApi.getById(Number(id));
      form.setFieldsValue({
        code: data.code,
        name: data.name,
        product_name: data.product_name,
        description: data.description,
        status: data.status,
        remark: data.remark,
      });
      setItems(data.items || []);
    } catch (error) {
      message.error('加载BOM信息失败');
    }
  };

  const addItem = () => {
    const newItem: BomItem = {
      sequence: String(items.length + 1),
      material_name: '',
      specification: '',
      unit: '',
      quantity: 0,
      unit_price: 0,
      remark: '',
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    // 重新编号
    newItems.forEach((item, i) => {
      item.sequence = String(i + 1);
    });
    setItems(newItems);
  };

  const updateItem = (index: number, field: keyof BomItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // 自动计算总价
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = field === 'quantity' ? value : newItems[index].quantity;
      const unitPrice = field === 'unit_price' ? value : newItems[index].unit_price;
      if (quantity && unitPrice) {
        newItems[index].total_price = Number(quantity) * Number(unitPrice);
      }
    }
    
    setItems(newItems);
  };

  const onFinish = async (values: any) => {
    if (items.length === 0) {
      message.warning('请至少添加一条BOM明细');
      return;
    }

    // 验证明细项
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.material_name) {
        message.warning(`第${i + 1}行的设备名称不能为空`);
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        message.warning(`第${i + 1}行的数量必须大于0`);
        return;
      }
    }

    setLoading(true);
    try {
      const bomData: Bom = {
        ...values,
        items: items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          unit_price: item.unit_price ? Number(item.unit_price) : undefined,
          total_price: item.total_price ? Number(item.total_price) : undefined,
        })),
      };

      if (isEdit) {
        await bomApi.update(Number(id!), bomData);
        message.success('更新成功');
      } else {
        await bomApi.create(bomData);
        message.success('创建成功');
      }
      navigate('/boms');
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const itemColumns: ColumnsType<BomItem & { index: number }> = [
    {
      title: '序号',
      dataIndex: 'sequence',
      key: 'sequence',
      width: 80,
      render: (text, _record, index) => (
        <Input
          value={text}
          onChange={(e) => updateItem(index, 'sequence', e.target.value)}
          placeholder="序号"
        />
      ),
    },
    {
      title: '设备名称',
      dataIndex: 'material_name',
      key: 'material_name',
      render: (text, _record, index) => (
        <Input
          value={text}
          onChange={(e) => updateItem(index, 'material_name', e.target.value)}
          placeholder="设备名称"
        />
      ),
    },
    {
      title: '规格型号',
      dataIndex: 'specification',
      key: 'specification',
      render: (text, _record, index) => (
        <Input
          value={text}
          onChange={(e) => updateItem(index, 'specification', e.target.value)}
          placeholder="规格型号"
        />
      ),
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 100,
      render: (text, _record, index) => (
        <Input
          value={text}
          onChange={(e) => updateItem(index, 'unit', e.target.value)}
          placeholder="单位"
        />
      ),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (text, _record, index) => (
        <InputNumber
          value={text}
          onChange={(value) => updateItem(index, 'quantity', value || 0)}
          min={0}
          precision={2}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 120,
      render: (text, _record, index) => (
        <InputNumber
          value={text}
          onChange={(value) => updateItem(index, 'unit_price', value || 0)}
          min={0}
          precision={2}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '总价',
      dataIndex: 'total_price',
      key: 'total_price',
      width: 120,
      render: (text) => text ? `¥${Number(text).toFixed(2)}` : '-',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      render: (text, _record, index) => (
        <Input
          value={text}
          onChange={(e) => updateItem(index, 'remark', e.target.value)}
          placeholder="备注"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, _record, index) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(index)}
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <Card title={isEdit ? '编辑BOM' : '新建BOM'}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          label="BOM编码"
          name="code"
          rules={[{ required: true, message: '请输入BOM编码' }]}
        >
          <Input placeholder="BOM编码" disabled={!!isEdit} />
        </Form.Item>

        <Form.Item
          label="BOM名称"
          name="name"
          rules={[{ required: true, message: '请输入BOM名称' }]}
        >
          <Input placeholder="BOM名称" />
        </Form.Item>

        <Form.Item label="产品名称" name="product_name">
          <Input placeholder="产品名称" />
        </Form.Item>

        <Form.Item label="描述" name="description">
          <Input.TextArea rows={2} placeholder="描述" />
        </Form.Item>

        <Form.Item label="状态" name="status" initialValue="draft">
          <Select>
            <Select.Option value="draft">草稿</Select.Option>
            <Select.Option value="active">生效</Select.Option>
            <Select.Option value="archived">归档</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="备注" name="remark">
          <Input.TextArea rows={2} placeholder="备注" />
        </Form.Item>

        <div style={{ marginBottom: 16 }}>
          <Space style={{ marginBottom: 8 }}>
            <Button type="dashed" icon={<PlusOutlined />} onClick={addItem}>
              添加明细项
            </Button>
          </Space>
          <Table
            columns={itemColumns}
            dataSource={items.map((item, index) => ({ ...item, index }))}
            rowKey={(_record, index) => `item-${index}`}
            pagination={false}
            size="small"
          />
        </div>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEdit ? '更新' : '创建'}
            </Button>
            <Button onClick={() => navigate('/boms')}>
              取消
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default BomForm;


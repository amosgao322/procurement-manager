import { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Button, Card, message, Space, Table, Select, DatePicker } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { quotationApi, bomApi, supplierApi } from '@/services/api';
import type { Quotation, QuotationItem, Bom, Supplier } from '@/types';
import dayjs from 'dayjs';

const QuotationForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [boms, setBoms] = useState<Bom[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = id && id !== 'new';

  useEffect(() => {
    loadBoms();
    loadSuppliers();
    if (isEdit && id && id !== 'new') {
      loadData();
    }
  }, [id]);

  const loadBoms = async () => {
    try {
      const response = await bomApi.getList({ page_size: 100 });
      setBoms(response.items);
    } catch (error) {
      console.error('加载BOM列表失败', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await supplierApi.getList({ page_size: 100 });
      setSuppliers(response.items);
    } catch (error) {
      console.error('加载供应商列表失败', error);
    }
  };

  const loadData = async () => {
    if (!id || id === 'new') return;
    try {
      const data = await quotationApi.getById(Number(id));
      
      // 检查状态，只有草稿状态才能编辑
      if (data.status !== 'draft') {
        message.warning('只有草稿状态的报价单才能编辑');
        navigate('/quotations');
        return;
      }
      
      form.setFieldsValue({
        code: data.code,
        supplier_id: data.supplier_id,
        bom_id: data.bom_id,
        title: data.title,
        quotation_date: data.quotation_date ? dayjs(data.quotation_date) : null,
        valid_until: data.valid_until ? dayjs(data.valid_until) : null,
        delivery_days: data.delivery_days,
        currency: data.currency || 'CNY',
        payment_terms: data.payment_terms,
        delivery_terms: data.delivery_terms,
        remark: data.remark,
      });
      
      // 加载明细项
      if (data.items && data.items.length > 0) {
        setItems(data.items.map(item => ({
          ...item,
          quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity,
          unit_price: typeof item.unit_price === 'string' ? parseFloat(item.unit_price) : item.unit_price,
          total_price: typeof item.total_price === 'string' ? parseFloat(item.total_price) : item.total_price,
        })));
      } else {
        setItems([]);
      }
    } catch (error) {
      message.error('加载报价单信息失败');
      navigate('/quotations');
    }
  };

  const handleBomChange = async (bomId: number) => {
    if (!bomId) return;
    try {
      const bom = await bomApi.getById(bomId);
      // 将BOM的明细项转换为报价明细项
      const quotationItems: QuotationItem[] = (bom.items || []).map(item => ({
        sequence: item.sequence || '',
        material_name: item.material_name,
        specification: item.specification || '',
        unit: item.unit || '',
        quantity: item.quantity,
        unit_price: item.unit_price || 0,
        total_price: item.total_price || (item.quantity * (item.unit_price || 0)),
        remark: item.remark || '',
      }));
      setItems(quotationItems);
    } catch (error) {
      message.error('加载BOM明细失败');
    }
  };

  const addItem = () => {
    const newItem: QuotationItem = {
      sequence: String(items.length + 1),
      material_name: '',
      specification: '',
      unit: '',
      quantity: 0,
      unit_price: 0,
      total_price: 0,
      remark: '',
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    newItems.forEach((item, i) => {
      item.sequence = String(i + 1);
    });
    setItems(newItems);
  };

  const updateItem = (index: number, field: keyof QuotationItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
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
      message.warning('请至少添加一条报价明细');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.material_name) {
        message.warning(`第${i + 1}行的物料名称不能为空`);
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        message.warning(`第${i + 1}行的数量必须大于0`);
        return;
      }
      if (!item.unit_price || item.unit_price <= 0) {
        message.warning(`第${i + 1}行的单价必须大于0`);
        return;
      }
    }

    setLoading(true);
    try {
      const quotationData: Quotation = {
        ...values,
        quotation_date: values.quotation_date ? values.quotation_date.toISOString() : undefined,
        valid_until: values.valid_until ? values.valid_until.toISOString() : undefined,
        items: items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          total_price: item.total_price ? Number(item.total_price) : Number(item.quantity) * Number(item.unit_price),
        })),
      };

      if (isEdit) {
        await quotationApi.update(Number(id!), quotationData);
        message.success('更新成功');
      } else {
        await quotationApi.create(quotationData);
        message.success('创建成功');
      }
      setTimeout(() => {
        navigate('/quotations');
      }, 500);
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const itemColumns: ColumnsType<QuotationItem & { index: number }> = [
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
      title: '物料名称',
      dataIndex: 'material_name',
      key: 'material_name',
      render: (text, _record, index) => (
        <Input
          value={text}
          onChange={(e) => updateItem(index, 'material_name', e.target.value)}
          placeholder="物料名称"
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
    <Card title={isEdit ? '编辑报价单' : '新建报价单'}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          label="报价单编码"
          name="code"
          rules={[{ required: true, message: '请输入报价单编码' }]}
        >
          <Input placeholder="报价单编码" disabled={!!isEdit} />
        </Form.Item>

        <Form.Item
          label="报价单标题"
          name="title"
          rules={[{ required: true, message: '请输入报价单标题' }]}
        >
          <Input placeholder="报价单标题" />
        </Form.Item>

        <Form.Item
          label="供应商"
          name="supplier_id"
          rules={[{ required: true, message: '请选择供应商' }]}
        >
          <Select placeholder="选择供应商" showSearch filterOption={(input, option) =>
            String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }>
            {suppliers.map(sup => (
              <Select.Option key={sup.id} value={sup.id} label={sup.name}>
                {sup.name} ({sup.code})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="关联BOM"
          name="bom_id"
        >
          <Select
            placeholder="选择BOM（可选，选择后会自动填充明细）"
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            onChange={handleBomChange}
          >
            {boms.map(bom => (
              <Select.Option key={bom.id} value={bom.id} label={bom.name}>
                {bom.name} ({bom.code})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="报价日期" name="quotation_date">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="有效期至" name="valid_until">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="交货天数" name="delivery_days">
          <InputNumber min={0} placeholder="交货天数" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="币种" name="currency" initialValue="CNY">
          <Select>
            <Select.Option value="CNY">人民币 (CNY)</Select.Option>
            <Select.Option value="USD">美元 (USD)</Select.Option>
            <Select.Option value="EUR">欧元 (EUR)</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="付款条件" name="payment_terms">
          <Input.TextArea rows={2} placeholder="付款条件" />
        </Form.Item>

        <Form.Item label="交货条件" name="delivery_terms">
          <Input.TextArea rows={2} placeholder="交货条件" />
        </Form.Item>

        <Form.Item label="备注" name="remark">
          <Input.TextArea rows={2} placeholder="备注" />
        </Form.Item>

        <div style={{ marginBottom: 16 }}>
          <Space style={{ marginBottom: 8 }}>
            <Button type="dashed" icon={<PlusOutlined />} onClick={addItem}>
              添加报价明细
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
            <Button onClick={() => navigate('/quotations')}>
              取消
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default QuotationForm;


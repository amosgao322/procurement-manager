import { useState, useEffect, useMemo } from 'react';
import { Form, Input, InputNumber, Button, Card, message, Space, Table, Select, DatePicker, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { bomApi, userApi } from '@/services/api'; // Add userApi
import type { Bom, BomItem, UserListItem } from '@/types'; // Add UserListItem
import dayjs from 'dayjs';

const BomForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<BomItem[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]); // User list
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = id && id !== 'new';

  useEffect(() => {
    loadUsers();
    if (isEdit) {
      loadData();
    }
  }, [id]);

  const loadUsers = async () => {
    try {
      const response = await userApi.getList({ limit: 1000, is_active: true });
      setUsers(response.items);
    } catch (error) {
      console.error('Failed to load users', error);
      // We don't block the page if user load fails, just log it.
    }
  };

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
        customer_name: data.customer_name,
        date: data.date ? dayjs(data.date) : undefined,
        version: data.version,
        sales_channel: data.sales_channel,
        prepared_by: data.prepared_by,
        pricing_reviewer: data.pricing_reviewer ? data.pricing_reviewer.split(',') : [], // Convert to array for Select
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
      material_category: '',
      material_grade: '',
      unit_weight: undefined,
      total_weight: undefined,
      brand_manufacturer: '',
      standard_number: '',
      surface_treatment: '',
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
    
    // 自动计算总重
    if (field === 'quantity' || field === 'unit_weight') {
      const quantity = field === 'quantity' ? value : newItems[index].quantity;
      const unitWeight = field === 'unit_weight' ? value : newItems[index].unit_weight;
      if (quantity && unitWeight) {
        newItems[index].total_weight = Number(quantity) * Number(unitWeight);
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
        message.warning(`第${i + 1}行的物料名称不能为空`);
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        message.warning(`第${i + 1}行的数量必须大于0`);
        return;
      }
    }

    setLoading(true);
    try {
      // Process pricing_reviewer from array to string
      const pricingReviewer = Array.isArray(values.pricing_reviewer) 
        ? values.pricing_reviewer.join(',') 
        : values.pricing_reviewer;

      const bomData: Bom = {
        ...values,
        pricing_reviewer: pricingReviewer,
        date: values.date ? values.date.format('YYYY-MM-DD') : undefined,
        items: items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          unit_price: item.unit_price ? Number(item.unit_price) : undefined,
          total_price: item.total_price ? Number(item.total_price) : undefined,
          unit_weight: item.unit_weight ? Number(item.unit_weight) : undefined,
          total_weight: item.total_weight ? Number(item.total_weight) : undefined,
        })),
      };

      // #region agent log
      const logDebug = (msg: string, data?: any) => {
        fetch('http://127.0.0.1:7242/ingest/537ba23e-5e9f-42c2-b268-5ad0203530c7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Form.tsx:onFinish',message:msg,data,timestamp:Date.now(),sessionId:'debug-session'})}).catch(()=>{});
      };
      logDebug('Submitting BOM data', bomData);
      // #endregion

      if (isEdit) {
        await bomApi.update(Number(id!), bomData);
        message.success('更新成功');
      } else {
        await bomApi.create(bomData);
        message.success('创建成功');
      }
      navigate('/boms');
    } catch (error: any) {
      // #region agent log
      const logDebugError = (msg: string, data?: any) => {
        fetch('http://127.0.0.1:7242/ingest/537ba23e-5e9f-42c2-b268-5ad0203530c7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Form.tsx:onFinish:error',message:msg,data,timestamp:Date.now(),sessionId:'debug-session'})}).catch(()=>{});
      };
      logDebugError('BOM submission failed', { error: error, response: error?.response });
      // #endregion
      message.error(error?.response?.data?.detail || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const itemColumns: ColumnsType<BomItem & { index: number }> = useMemo(() => [
    {
      title: '序号',
      dataIndex: 'sequence',
      key: 'sequence',
      width: 80,
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => updateItem(record.index, 'sequence', e.target.value)}
          placeholder="序号"
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      title: '物料名称',
      dataIndex: 'material_name',
      key: 'material_name',
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => updateItem(record.index, 'material_name', e.target.value)}
          placeholder="物料名称"
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      title: '规格型号',
      dataIndex: 'specification',
      key: 'specification',
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => updateItem(record.index, 'specification', e.target.value)}
          placeholder="规格型号"
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 100,
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => updateItem(record.index, 'unit', e.target.value)}
          placeholder="单位"
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (text, record) => (
        <InputNumber
          value={text}
          onChange={(value) => updateItem(record.index, 'quantity', value || 0)}
          min={0}
          precision={2}
          style={{ width: '100%' }}
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 120,
      render: (text, record) => (
        <InputNumber
          value={text}
          onChange={(value) => updateItem(record.index, 'unit_price', value || 0)}
          min={0}
          precision={2}
          style={{ width: '100%' }}
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => e.stopPropagation()}
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
      title: '物料类别',
      dataIndex: 'material_category',
      key: 'material_category',
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => updateItem(record.index, 'material_category', e.target.value)}
          placeholder="物料类别"
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      title: '材质/牌号',
      dataIndex: 'material_grade',
      key: 'material_grade',
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => updateItem(record.index, 'material_grade', e.target.value)}
          placeholder="材质/牌号"
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      title: '单重（kg）',
      dataIndex: 'unit_weight',
      key: 'unit_weight',
      width: 120,
      render: (text, record) => (
        <InputNumber
          value={text}
          onChange={(value) => updateItem(record.index, 'unit_weight', value || undefined)}
          min={0}
          precision={2}
          style={{ width: '100%' }}
          placeholder="单重"
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      title: '总重（kg）',
      dataIndex: 'total_weight',
      key: 'total_weight',
      width: 120,
      render: (text) => text ? `${Number(text).toFixed(2)}` : '-',
    },
    {
      title: '品牌/厂家',
      dataIndex: 'brand_manufacturer',
      key: 'brand_manufacturer',
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => updateItem(record.index, 'brand_manufacturer', e.target.value)}
          placeholder="品牌/厂家"
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      title: '标准号/图床',
      dataIndex: 'standard_number',
      key: 'standard_number',
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => updateItem(record.index, 'standard_number', e.target.value)}
          placeholder="标准号/图床"
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      title: '表面处理',
      dataIndex: 'surface_treatment',
      key: 'surface_treatment',
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => updateItem(record.index, 'surface_treatment', e.target.value)}
          placeholder="表面处理"
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => updateItem(record.index, 'remark', e.target.value)}
          placeholder="备注"
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(record.index)}
        >
          删除
        </Button>
      ),
    },
  ], [items]);

  return (
    <Card title={isEdit ? '编辑BOM' : '新建BOM'}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="BOM编码"
              name="code"
              extra="新建时系统将自动生成B打头的编码"
            >
              <Input placeholder="系统自动生成" disabled />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="项目名称" name="product_name">
              <Input placeholder="项目名称" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={8}>
            <Form.Item label="客户名称" name="customer_name">
              <Input placeholder="客户名称" />
            </Form.Item>
          </Col>
          <Col span={8}>
             <Form.Item label="状态" name="status" initialValue="草稿">
              <Select>
                <Select.Option value="草稿">草稿</Select.Option>
                <Select.Option value="生效">生效</Select.Option>
                <Select.Option value="归档">归档</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="日期" name="date">
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={8}>
            <Form.Item label="版本号" name="version">
              <Input placeholder="版本号" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="销售渠道" name="sales_channel">
              <Input placeholder="销售渠道" />
            </Form.Item>
          </Col>
          <Col span={8}>
             <Form.Item label="核价人" name="pricing_reviewer">
              <Select
                mode="multiple"
                placeholder="请选择核价人（可多选）"
                allowClear
                options={users.map(user => ({
                  label: user.real_name || user.username,
                  value: user.real_name || user.username
                }))}
              />
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={24}>
           <Col span={24}>
             <Form.Item label="描述" name="description">
              <Input placeholder="描述" />
            </Form.Item>
          </Col>
        </Row>

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
            dataSource={items.map((item, index) => ({ ...item, index, key: `item-${index}` }))}
            rowKey="key"
            pagination={false}
            size="small"
            scroll={{ x: 'max-content' }}
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


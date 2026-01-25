import { useState, useEffect } from 'react';
import { Table, Button, Input, Space, message, Tag, Modal, Form, Select, DatePicker, Card, Row, Col } from 'antd';
import { SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { quotationApi, supplierApi } from '@/services/api';
import type { Quotation, Supplier } from '@/types';
import { hasPermission } from '@/utils/auth';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const QuotationList: React.FC = () => {
  const [data, setData] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    loadData();
  }, [page, pageSize]);

  const loadSuppliers = async () => {
    try {
      const response = await supplierApi.getList({ page_size: 1000 });
      setSuppliers(response.items);
    } catch (error) {
      console.error('加载供应商列表失败', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const response = await quotationApi.getList({
        page,
        page_size: pageSize,
        keyword: values.keyword || undefined,
        title: values.title || undefined,
        supplier_id: values.supplier_id || undefined,
        status: values.status || undefined,
        created_at_start: values.date_range?.[0]?.format('YYYY-MM-DD HH:mm:ss'),
        created_at_end: values.date_range?.[1]?.format('YYYY-MM-DD HH:mm:ss'),
      });
      setData(response.items);
      setTotal(response.total);
    } catch (error) {
      message.error('加载报价单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (page === 1) {
      loadData();
    } else {
      setPage(1);
    }
  };

  const handleReset = () => {
    form.resetFields();
    if (page === 1) {
      loadData();
    } else {
      setPage(1);
    }
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个报价单吗？',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await quotationApi.delete(id);
          message.success('删除成功');
          loadData();
        } catch (error: any) {
          message.error(error?.response?.data?.detail || '删除失败');
        }
      },
    });
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      draft: { color: 'default', text: '草稿' },
      submitted: { color: 'processing', text: '已提交' },
      approved: { color: 'success', text: '已审批' },
      rejected: { color: 'error', text: '已拒绝' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns: ColumnsType<Quotation> = [
    {
      title: '编码',
      dataIndex: 'code',
      key: 'code',
      width: 150,
    },
    {
      title: '报价单标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: 'BOM',
      dataIndex: ['bom', 'name'],
      key: 'bom_name',
      width: 150,
    },
    {
      title: '供应商',
      dataIndex: ['supplier', 'name'],
      key: 'supplier_name',
      width: 150,
    },
    {
      title: '总金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      align: 'right',
      width: 120,
      render: (text) => {
        if (!text) return '-';
        const num = typeof text === 'string' ? parseFloat(text) : text;
        return `¥${Number(num).toFixed(2)}`;
      },
    },
    {
      title: '有效期',
      dataIndex: 'valid_until',
      key: 'valid_until',
      width: 180,
      render: (text) => {
        if (!text) return '-';
        return dayjs(text).format('YYYY-MM-DD');
      },
    },
    {
      title: '交期（天）',
      dataIndex: 'delivery_days',
      key: 'delivery_days',
      width: 120,
      align: 'right',
      render: (text) => {
        if (!text && text !== 0) return '-';
        return `${text} 天`;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: getStatusTag,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text) => text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/quotations/${record.id}`)}
          >
            查看
          </Button>
          {record.status === 'draft' && (
            <>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => navigate(`/quotations/${record.id}/edit`)}
              >
                编辑
              </Button>
              {hasPermission('quotation:delete') && (
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => record.id && handleDelete(record.id)}
                >
                  删除
                </Button>
              )}
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" onFinish={handleSearch}>
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            <Col span={6}>
              <Form.Item name="keyword" label="编码" style={{ width: '100%', marginBottom: 0 }}>
                <Input placeholder="报价单编码" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="title" label="标题" style={{ width: '100%', marginBottom: 0 }}>
                <Input placeholder="报价单标题" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="supplier_id" label="供应商" style={{ width: '100%', marginBottom: 0 }}>
                <Select placeholder="请选择供应商" allowClear showSearch optionFilterProp="children">
                  {suppliers.map((supplier) => (
                    <Select.Option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="status" label="状态" style={{ width: '100%', marginBottom: 0 }}>
                <Select placeholder="请选择状态" allowClear>
                  <Select.Option value="draft">草稿</Select.Option>
                  <Select.Option value="submitted">已提交</Select.Option>
                  <Select.Option value="approved">已审批</Select.Option>
                  <Select.Option value="rejected">已拒绝</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8} style={{ marginTop: 16 }}>
              <Form.Item name="date_range" label="创建时间" style={{ width: '100%', marginBottom: 0 }}>
                <RangePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={16} style={{ marginTop: 16, textAlign: 'right' }}>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  搜索
                </Button>
                <Button onClick={handleReset} icon={<ReloadOutlined />}>
                  重置
                </Button>
                <Button type="primary" onClick={() => navigate('/quotations/new')}>
                  新建报价单
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1500 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => {
            setPage(page);
            setPageSize(pageSize);
          },
        }}
      />
    </div>
  );
};

export default QuotationList;

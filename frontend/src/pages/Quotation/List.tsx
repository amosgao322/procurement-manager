import { useState, useEffect } from 'react';
import { Table, Button, Input, Space, message, Tag } from 'antd';
import { SearchOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { quotationApi } from '@/services/api';
import type { Quotation } from '@/types';
import dayjs from 'dayjs';

const QuotationList: React.FC = () => {
  const [data, setData] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [page, pageSize, keyword]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await quotationApi.getList({
        page,
        page_size: pageSize,
        keyword: keyword || undefined,
      });
      setData(response.items);
      setTotal(response.total);
    } catch (error) {
      message.error('加载报价单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setKeyword(value);
    setPage(1);
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
    },
    {
      title: 'BOM',
      dataIndex: ['bom', 'name'],
      key: 'bom_name',
    },
    {
      title: '供应商',
      dataIndex: ['supplier', 'name'],
      key: 'supplier_name',
    },
    {
      title: '总金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      align: 'right',
      render: (text) => {
        if (!text) return '-';
        const num = typeof text === 'string' ? parseFloat(text) : text;
        return `¥${Number(num).toFixed(2)}`;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
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
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => navigate(`/quotations/${record.id}/edit`)}
            >
              编辑
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="搜索报价单编码"
          allowClear
          style={{ width: 300 }}
          onSearch={handleSearch}
          enterButton={<SearchOutlined />}
        />
        <Button type="primary" onClick={() => navigate('/quotations/new')}>
          新建报价单
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
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


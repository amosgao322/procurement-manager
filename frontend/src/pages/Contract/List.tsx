import { useState, useEffect } from 'react';
import { Table, Button, Input, Space, message } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { contractApi } from '@/services/api';
import type { Contract } from '@/types';
import dayjs from 'dayjs';

const ContractList: React.FC = () => {
  const [data, setData] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    loadData();
  }, [page, pageSize, keyword]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await contractApi.getList({
        page,
        page_size: pageSize,
        keyword: keyword || undefined,
      });
      setData(response.items);
      setTotal(response.total);
    } catch (error) {
      message.error('加载合同列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setKeyword(value);
    setPage(1);
  };

  const columns: ColumnsType<Contract> = [
    {
      title: '编码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '供应商',
      dataIndex: ['supplier', 'name'],
      key: 'supplier_name',
    },
    {
      title: '合同标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '合同金额',
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
      title: '签订日期',
      dataIndex: 'sign_date',
      key: 'sign_date',
      render: (text) => text ? dayjs(text).format('YYYY-MM-DD') : '-',
    },
    {
      title: '到期日期',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (text) => text ? dayjs(text).format('YYYY-MM-DD') : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
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
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => message.info('详情功能待实现')}
        >
          查看
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="搜索合同编码"
          allowClear
          style={{ width: 300 }}
          onSearch={handleSearch}
          enterButton={<SearchOutlined />}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => message.info('新建功能待实现')}>
          新建合同
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

export default ContractList;


import { useState, useEffect } from 'react';
import { Table, Button, Input, Space, message, Modal, Tag } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { supplierApi } from '@/services/api';
import type { Supplier } from '@/types';

const SupplierList: React.FC = () => {
  const [data, setData] = useState<Supplier[]>([]);
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
      const response = await supplierApi.getList({
        page,
        page_size: pageSize,
        keyword: keyword || undefined,
      });
      setData(response.items);
      setTotal(response.total);
    } catch (error) {
      message.error('加载供应商列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setKeyword(value);
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个供应商吗？',
      onOk: async () => {
        try {
          await supplierApi.delete(id);
          message.success('删除成功');
          loadData();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const columns: ColumnsType<Supplier> = [
    {
      title: '编码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '联系人',
      dataIndex: 'contact_person',
      key: 'contact_person',
    },
    {
      title: '联系电话',
      dataIndex: 'contact_phone',
      key: 'contact_phone',
    },
    {
      title: '联系邮箱',
      dataIndex: 'contact_email',
      key: 'contact_email',
    },
    {
      title: '信用等级',
      dataIndex: 'credit_rating',
      key: 'credit_rating',
      width: 100,
      render: (rating: string) => {
        if (!rating) return '-';
        const colorMap: Record<string, string> = {
          '优秀': 'green',
          '良好': 'blue',
          '一般': 'default',
          '较差': 'orange',
          '差': 'red',
        };
        return <Tag color={colorMap[rating] || 'default'}>{rating}</Tag>;
      },
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/suppliers/${record.id}`)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id!)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="搜索供应商名称或编码"
          allowClear
          style={{ width: 300 }}
          onSearch={handleSearch}
          enterButton={<SearchOutlined />}
        />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/suppliers/new')}>
            新建供应商
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

export default SupplierList;


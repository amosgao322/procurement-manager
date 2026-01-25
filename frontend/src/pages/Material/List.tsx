import { useState, useEffect } from 'react';
import { Table, Button, Input, Space, message, Modal, Tag, Select } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { materialApi } from '@/services/api';
import type { Material, MaterialPriceStatus } from '@/types';
import MaterialFormModal from './Form';
import dayjs from 'dayjs';

const { Option } = Select;

const MaterialList: React.FC = () => {
  const [data, setData] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [priceStatus, setPriceStatus] = useState<string | undefined>(undefined);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState<number | undefined>(undefined);

  useEffect(() => {
    loadData();
  }, [page, pageSize, keyword, priceStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await materialApi.getList({
        page,
        page_size: pageSize,
        keyword: keyword || undefined,
        price_status: priceStatus,
      });
      setData(response.items);
      setTotal(response.total);
    } catch (error) {
      message.error('加载物料列表失败');
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
      content: '确定要删除这个物料吗？',
      onOk: async () => {
        try {
          await materialApi.delete(id);
          message.success('删除成功');
          loadData();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const getPriceStatusTag = (status?: MaterialPriceStatus) => {
    if (!status) return <Tag>-</Tag>;
    const statusMap: Record<MaterialPriceStatus, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待确认' },
      valid: { color: 'green', text: '有效' },
      expired: { color: 'red', text: '无效' },
      abnormal: { color: 'red', text: '异常' },
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const columns: ColumnsType<Material> = [
    {
      title: '编码',
      dataIndex: 'code',
      key: 'code',
      width: 150,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: '规格型号',
      dataIndex: 'specification',
      key: 'specification',
      width: 200,
      ellipsis: true,
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 100,
    },
    {
      title: '品牌',
      dataIndex: 'brand',
      key: 'brand',
      width: 120,
    },
    {
      title: '价格状态',
      dataIndex: 'price_status',
      key: 'price_status',
      width: 100,
      render: (status: MaterialPriceStatus) => getPriceStatusTag(status),
    },
    {
      title: '最近价格',
      key: 'last_price',
      width: 120,
      align: 'right',
      render: (_, record) => {
        if (!record.last_price) return '-';
        const currency = record.currency || 'CNY';
        const symbol = currency === 'CNY' ? '¥' : currency;
        return `${symbol}${Number(record.last_price).toFixed(2)}`;
      },
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>{isActive ? '启用' : '停用'}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (value?: string) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingMaterialId(record.id);
              setFormModalVisible(true);
            }}
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
          placeholder="搜索物料名称、编码或规格"
          allowClear
          style={{ width: 300 }}
          onSearch={handleSearch}
          enterButton={<SearchOutlined />}
        />
        <Select
          placeholder="价格状态"
          allowClear
          style={{ width: 120 }}
          value={priceStatus}
          onChange={(value) => {
            setPriceStatus(value);
            setPage(1);
          }}
        >
          <Option value="pending">待确认</Option>
          <Option value="valid">有效</Option>
          <Option value="expired">无效</Option>
          <Option value="abnormal">异常</Option>
        </Select>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditingMaterialId(undefined);
          setFormModalVisible(true);
        }}>
          新建物料
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          showTotal: (total) => `共 ${total} 条`,
          showSizeChanger: true,
          showQuickJumper: true,
          onChange: (page, pageSize) => {
            setPage(page);
            setPageSize(pageSize);
          },
        }}
        scroll={{ x: 'max-content' }}
      />

      <MaterialFormModal
        open={formModalVisible}
        onCancel={() => {
          setFormModalVisible(false);
          setEditingMaterialId(undefined);
        }}
        onSuccess={() => {
          loadData();
        }}
        materialId={editingMaterialId}
      />
    </div>
  );
};

export default MaterialList;


import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Table, Button, Space, message, Spin } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { bomApi } from '@/services/api';
import type { Bom, BomItem } from '@/types';
import dayjs from 'dayjs';

const BomDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [bom, setBom] = useState<Bom | null>(null);

  useEffect(() => {
    if (id && id !== 'new') {
      loadData();
    } else if (id === 'new') {
      navigate('/boms/new');
    }
  }, [id]);

  const loadData = async () => {
    if (!id || id === 'new') return;
    setLoading(true);
    try {
      const data = await bomApi.getById(Number(id));
      setBom(data);
    } catch (error) {
      message.error('加载BOM详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!id || id === 'new') return;
    try {
      const blob = await bomApi.export(Number(id));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BOM_${bom?.code || id}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const itemColumns: ColumnsType<BomItem> = [
    {
      title: '序号',
      dataIndex: 'sequence',
      key: 'sequence',
      width: 80,
    },
    {
      title: '设备名称',
      dataIndex: 'material_name',
      key: 'material_name',
    },
    {
      title: '规格型号',
      dataIndex: 'specification',
      key: 'specification',
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right',
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 100,
      align: 'right',
      render: (text) => {
        if (!text) return '-';
        const num = typeof text === 'string' ? parseFloat(text) : text;
        return `¥${Number(num).toFixed(2)}`;
      },
    },
    {
      title: '总价',
      dataIndex: 'total_price',
      key: 'total_price',
      width: 120,
      align: 'right',
      render: (text) => {
        if (!text) return '-';
        const num = typeof text === 'string' ? parseFloat(text) : text;
        return `¥${Number(num).toFixed(2)}`;
      },
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
    },
  ];

  if (id === 'new') {
    return <div>新建BOM功能待实现</div>;
  }

  if (loading) {
    return <Spin size="large" style={{ display: 'block', textAlign: 'center', marginTop: 50 }} />;
  }

  if (!bom) {
    return <div>BOM不存在</div>;
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/boms')}>
          返回
        </Button>
        <Button onClick={() => navigate(`/boms/${bom.id}/edit`)}>
          编辑
        </Button>
        <Button icon={<DownloadOutlined />} onClick={handleExport}>
          导出Excel
        </Button>
      </Space>

      <Card title="BOM基本信息" style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="编码">{bom.code}</Descriptions.Item>
          <Descriptions.Item label="名称">{bom.name}</Descriptions.Item>
          <Descriptions.Item label="产品名称">{bom.product_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="状态">{bom.status || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {bom.created_at ? dayjs(bom.created_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {bom.updated_at ? dayjs(bom.updated_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="BOM明细">
        <Table
          columns={itemColumns}
          dataSource={bom.items || []}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default BomDetail;


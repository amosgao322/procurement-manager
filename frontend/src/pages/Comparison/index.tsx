import { useState, useEffect } from 'react';
import { Card, Select, Button, Table, message, Space } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { bomApi, comparisonApi } from '@/services/api';
import type { Bom } from '@/types';

const Comparison: React.FC = () => {
  const [boms, setBoms] = useState<Bom[]>([]);
  const [selectedBomId, setSelectedBomId] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState<any>(null);

  useEffect(() => {
    loadBoms();
  }, []);

  const loadBoms = async () => {
    try {
      const response = await bomApi.getList({ page_size: 100 });
      setBoms(response.items);
    } catch (error) {
      message.error('加载BOM列表失败');
    }
  };

  const handleCompare = async () => {
    if (!selectedBomId) {
      message.warning('请选择BOM');
      return;
    }
    setLoading(true);
    try {
      const data = await comparisonApi.compareQuotations(selectedBomId);
      setComparisonData(data);
    } catch (error) {
      message.error('比价分析失败');
    } finally {
      setLoading(false);
    }
  };

  const comparisonColumns: ColumnsType<any> = [
    {
      title: '物料名称',
      dataIndex: 'material_name',
      key: 'material_name',
    },
    {
      title: '供应商',
      dataIndex: 'supplier_name',
      key: 'supplier_name',
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      align: 'right',
      render: (text) => text && typeof text === 'number' ? `¥${text.toFixed(2)}` : '-',
    },
    {
      title: '交期（天）',
      dataIndex: 'delivery_days',
      key: 'delivery_days',
      align: 'right',
    },
    {
      title: '评分',
      dataIndex: 'score',
      key: 'score',
      align: 'right',
      render: (text) => text && typeof text === 'number' ? `${text.toFixed(1)}分` : '-',
    },
  ];

  return (
    <div>
      <Card title="询比价分析">
        <Space style={{ marginBottom: 16 }}>
          <Select
            style={{ width: 300 }}
            placeholder="选择BOM"
            value={selectedBomId}
            onChange={setSelectedBomId}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={boms.map(bom => ({
              label: `${bom.code} - ${bom.name}`,
              value: bom.id,
            }))}
          />
          <Button
            type="primary"
            icon={<SwapOutlined />}
            onClick={handleCompare}
            loading={loading}
          >
            开始比价
          </Button>
        </Space>

        {comparisonData && (
          <div>
            <Card title="比价结果" style={{ marginTop: 16 }}>
              <Table
                columns={comparisonColumns}
                dataSource={comparisonData.comparisons || []}
                rowKey={(record, index) => `${record.material_name || 'unknown'}-${index}`}
                pagination={false}
              />
            </Card>

            {comparisonData.total_score && (
              <Card title="供应商总分对比" style={{ marginTop: 16 }}>
                <Table
                  columns={[
                    { title: '供应商', dataIndex: 'supplier', key: 'supplier' },
                    { title: '总分', dataIndex: 'score', key: 'score', align: 'right' },
                  ]}
                  dataSource={Object.entries(comparisonData.total_score).map(([key, value]) => ({
                    key,
                    supplier: key,
                    score: typeof value === 'number' ? value.toFixed(1) : String(value),
                  }))}
                  pagination={false}
                />
              </Card>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Comparison;


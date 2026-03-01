import { bomApi, comparisonApi } from '@/services/api';
import type {
  Bom,
  ComparisonItemRow,
  QuotationBasicInfo,
  QuotationComparisonResponse
} from '@/types';
// import { DownloadOutlined, SwapOutlined } from '@ant-design/icons';
import { SwapOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Descriptions, Divider,
  message,
  Select,
  Space,
  Spin,
  Table,
  Tag
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

const Comparison: React.FC = () => {
  const [boms, setBoms] = useState<Bom[]>([]);
  const [selectedBomId, setSelectedBomId] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState<QuotationComparisonResponse | null>(null);
  const [quotations, setQuotations] = useState<QuotationBasicInfo[]>([]);
  const [loadingQuotations, setLoadingQuotations] = useState(false);

  useEffect(() => {
    loadBoms();
  }, []);

  useEffect(() => {
    if (selectedBomId) {
      loadQuotations();
    } else {
      setQuotations([]);
      setComparisonData(null);
    }
  }, [selectedBomId]);

  const loadBoms = async () => {
    try {
      const response = await bomApi.getList({ page_size: 100 });
      setBoms(response.items);
    } catch (error) {
      message.error('加载BOM列表失败');
    }
  };

  const loadQuotations = async () => {
    if (!selectedBomId) return;
    setLoadingQuotations(true);
    try {
      const data = await comparisonApi.getQuotationsByBom(selectedBomId);
      setQuotations(data);
    } catch (error) {
      message.error('加载报价单列表失败');
    } finally {
      setLoadingQuotations(false);
    }
  };

  const handleCompare = async () => {
    if (!selectedBomId) {
      message.warning('请选择BOM');
      return;
    }
    if (quotations.length === 0) {
      message.warning('该BOM没有关联的报价单');
      return;
    }
    setLoading(true);
    try {
      const data = await comparisonApi.compareQuotations(selectedBomId);
      setComparisonData(data);
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '比价分析失败');
    } finally {
      setLoading(false);
    }
  };

  // 导出功能暂时隐藏
  // const handleExport = async () => {
  //   if (!selectedBomId) return;
  //   try {
  //     const blob = await comparisonApi.exportComparison(selectedBomId);
  //     const url = window.URL.createObjectURL(blob);
  //     const a = document.createElement('a');
  //     a.href = url;
  //     const bom = boms.find(b => b.id === selectedBomId);
  //     a.download = `报价对比_${bom?.code || selectedBomId}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
  //     a.click();
  //     window.URL.revokeObjectURL(url);
  //     message.success('导出成功');
  //   } catch (error: any) {
  //     message.error(error?.response?.data?.detail || '导出失败');
  //   }
  // };

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

  // 构建对比表格的列
  const buildComparisonColumns = (): ColumnsType<any> => {
    if (!comparisonData) return [];

    const baseColumns: ColumnsType<any> = [
      {
        title: '序号',
        dataIndex: 'sequence',
        key: 'sequence',
        width: 80,
        fixed: 'left',
      },
      {
        title: '物料名称',
        dataIndex: 'material_name',
        key: 'material_name',
        width: 200,
        fixed: 'left',
      },
      {
        title: '规格型号',
        dataIndex: 'specification',
        key: 'specification',
        width: 200,
        fixed: 'left',
      },
      {
        title: '单位',
        dataIndex: 'unit',
        key: 'unit',
        width: 80,
        fixed: 'left',
      },
      {
        title: '数量',
        dataIndex: 'bom_quantity',
        key: 'bom_quantity',
        width: 100,
        fixed: 'left',
        align: 'right',
        render: (text) => text ? Number(text).toFixed(2) : '-',
      },
    ];

    // 为每个报价单添加一个综合列，包含所有信息
    const quotationColumns: ColumnsType<any> = [];
    comparisonData.quotations.forEach((quotation) => {
      const isBestDelivery = comparisonData.best_markers.shortest_delivery_days === quotation.id;

      quotationColumns.push({
        title: (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{quotation.supplier_name}</div>
            <div style={{ fontSize: '11px', color: '#999' }}>{quotation.code}</div>
            {quotation.credit_rating && (
              <div style={{ marginTop: 2 }}>
                <Tag
                  color={
                    quotation.credit_rating === '优秀' ? 'success' :
                      quotation.credit_rating === '良好' ? 'processing' :
                        quotation.credit_rating === '一般' ? 'default' :
                          quotation.credit_rating === '较差' ? 'warning' : 'error'
                  }
                  style={{ fontSize: '11px' }}
                >
                  {quotation.credit_rating}
                </Tag>
              </div>
            )}
          </div>
        ),
        key: `quotation_${quotation.id}`,
        width: 200,
        align: 'center',
        render: (_: any, record: ComparisonItemRow) => {
          const cell = record.cells.find(c => c.quotation_id === quotation.id);
          if (!cell || !cell.matched) {
            return <div style={{ color: '#999', fontStyle: 'italic' }}>未匹配</div>;
          }

          const isBestPrice = comparisonData.best_markers.item_lowest_price[record.bom_item_id] === quotation.id;

          return (
            <div style={{
              padding: '8px',
              backgroundColor: isBestPrice ? '#f6ffed' : '#fafafa',
              borderRadius: '4px',
              border: isBestPrice ? '1px solid #b7eb8f' : '1px solid #e8e8e8'
            }}>
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: 2 }}>单价</div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: isBestPrice ? 'bold' : 'normal',
                  color: isBestPrice ? '#52c41a' : '#333'
                }}>
                  {cell.unit_price ? `¥${Number(cell.unit_price).toFixed(2)}` : '-'}
                  {isBestPrice && <Tag color="success" style={{ marginLeft: 4 }}>最低</Tag>}
                </div>
              </div>

              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: 2 }}>总价</div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>
                  {cell.total_price ? `¥${Number(cell.total_price).toFixed(2)}` : '-'}
                </div>
              </div>

              <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: 2 }}>品牌</div>
                  <div style={{ fontSize: '13px' }}>{cell.brand || '-'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: 2 }}>交期</div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: isBestDelivery && cell.delivery_days === quotation.delivery_days ? 'bold' : 'normal',
                    color: isBestDelivery && cell.delivery_days === quotation.delivery_days ? '#1890ff' : '#333'
                  }}>
                    {cell.delivery_days !== undefined ? `${cell.delivery_days}天` : '-'}
                  </div>
                </div>
              </div>

              {cell.remark && (
                <div style={{
                  marginTop: 6,
                  paddingTop: 6,
                  borderTop: '1px solid #e8e8e8',
                  fontSize: '11px',
                  color: '#999',
                  maxHeight: '40px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  备注: {cell.remark}
                </div>
              )}
            </div>
          );
        },
      });
    });

    return [...baseColumns, ...quotationColumns];
  };

  return (
    <div>
      <Card title="询比价分析">
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            style={{ width: 300 }}
            placeholder="选择BOM"
            value={selectedBomId}
            onChange={setSelectedBomId}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={boms.map(bom => {
              const displayName = bom.product_name || bom.code;
              return {
                label: `${bom.code} - ${displayName}`,
                value: bom.id,
              };
            })}
          />
          <Button
            type="primary"
            icon={<SwapOutlined />}
            onClick={handleCompare}
            loading={loading}
            disabled={!selectedBomId || quotations.length === 0}
          >
            开始比价
          </Button>
          {/* 导出功能暂时隐藏 */}
          {/* {comparisonData && (
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              导出Excel
            </Button>
          )} */}
        </Space>

        {/* 报价单列表 */}
        {selectedBomId && (
          <div style={{ marginBottom: 16 }}>
            {loadingQuotations ? (
              <Spin />
            ) : quotations.length > 0 ? (
              <Alert
                message={`已找到 ${quotations.length} 个报价单`}
                description={
                  <div style={{ marginTop: 8 }}>
                    {quotations.map(q => (
                      <Tag key={q.id} style={{ marginBottom: 4 }}>
                        {q.supplier_name} ({q.code}) - {getStatusTag(q.status)} -
                        {q.total_amount ? ` ¥${Number(q.total_amount).toFixed(2)}` : ' 未报价'}
                      </Tag>
                    ))}
                  </div>
                }
                type="info"
                showIcon
              />
            ) : (
              <Alert
                message="该BOM没有关联的报价单"
                type="warning"
                showIcon
              />
            )}
          </div>
        )}

        {/* 对比结果 */}
        {comparisonData && (
          <div>
            {/* BOM和报价单基本信息 */}
            <Card title="基本信息对比" style={{ marginBottom: 16 }}>
              <Descriptions column={2} bordered>
                <Descriptions.Item label="BOM编码">{comparisonData.bom_code}</Descriptions.Item>
                <Descriptions.Item label="项目名称">{comparisonData.product_name || '-'}</Descriptions.Item>
              </Descriptions>
              <Divider />
              <Table
                columns={[
                  { title: '供应商', dataIndex: 'supplier_name', key: 'supplier_name' },
                  { title: '报价单编码', dataIndex: 'code', key: 'code' },
                  {
                    title: '信用等级',
                    dataIndex: 'credit_rating',
                    key: 'credit_rating',
                    render: (text) => {
                      if (!text) return '-';
                      const ratingMap: Record<string, { color: string; text: string }> = {
                        '优秀': { color: 'success', text: '优秀' },
                        '良好': { color: 'processing', text: '良好' },
                        '一般': { color: 'default', text: '一般' },
                        '较差': { color: 'warning', text: '较差' },
                        '差': { color: 'error', text: '差' },
                      };
                      const config = ratingMap[text] || { color: 'default', text: text };
                      return <Tag color={config.color}>{config.text}</Tag>;
                    }
                  },
                  {
                    title: '总价',
                    dataIndex: 'total_amount',
                    key: 'total_amount',
                    align: 'right',
                    render: (text, record) => {
                      const isBest = comparisonData.best_markers.lowest_total_price === record.id;
                      return text ? (
                        <span style={{
                          backgroundColor: isBest ? '#f6ffed' : 'transparent',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontWeight: isBest ? 'bold' : 'normal'
                        }}>
                          ¥{Number(text).toFixed(2)}
                          {isBest && <Tag color="success" style={{ marginLeft: 4 }}>最低</Tag>}
                        </span>
                      ) : '-';
                    }
                  },
                  {
                    title: '交货天数',
                    dataIndex: 'delivery_days',
                    key: 'delivery_days',
                    align: 'right',
                    render: (text, record) => {
                      const isBest = comparisonData.best_markers.shortest_delivery_days === record.id;
                      return text !== undefined ? (
                        <span style={{
                          backgroundColor: isBest ? '#e6f7ff' : 'transparent',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontWeight: isBest ? 'bold' : 'normal'
                        }}>
                          {text}
                          {isBest && <Tag color="processing" style={{ marginLeft: 4 }}>最短</Tag>}
                        </span>
                      ) : '-';
                    }
                  },
                  {
                    title: '有效期至',
                    dataIndex: 'valid_until',
                    key: 'valid_until',
                    render: (text, record) => {
                      const isBest = comparisonData.best_markers.longest_valid_until === record.id;
                      return text ? (
                        <span style={{
                          backgroundColor: isBest ? '#f9f0ff' : 'transparent',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontWeight: isBest ? 'bold' : 'normal'
                        }}>
                          {dayjs(text).format('YYYY-MM-DD')}
                          {isBest && <Tag color="purple" style={{ marginLeft: 4 }}>最长</Tag>}
                        </span>
                      ) : '-';
                    }
                  },
                  { title: '付款条件', dataIndex: 'payment_terms', key: 'payment_terms' },
                  { title: '交货条件', dataIndex: 'delivery_terms', key: 'delivery_terms' },
                  { title: '状态', dataIndex: 'status', key: 'status', render: getStatusTag },
                ]}
                dataSource={comparisonData.quotations}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>

            {/* 明细项对比 */}
            <Card title="明细项对比">
              <Table
                columns={buildComparisonColumns()}
                dataSource={comparisonData.item_rows}
                rowKey="bom_item_id"
                pagination={false}
                scroll={{ x: 'max-content' }}
                size="small"
              />
            </Card>

          </div>
        )}
      </Card>
    </div>
  );
};

export default Comparison;

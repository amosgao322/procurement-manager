import { bomApi } from '@/services/api';
import type {
  Bom,
  BOMCostAnalysisResponse,
  BomItem, BOMItemPriceHistoryResponse,
  PriceSourceStat
} from '@/types';
import {
  ArrowLeftOutlined,
  DollarOutlined,
  DownloadOutlined, HistoryOutlined
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Descriptions,
  Drawer,
  Empty,
  message,
  Modal,
  Progress,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const BomDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [bom, setBom] = useState<Bom | null>(null);
  const [priceHistoryVisible, setPriceHistoryVisible] = useState(false);
  const [priceHistoryLoading, setPriceHistoryLoading] = useState(false);
  const [priceHistoryData, setPriceHistoryData] = useState<BOMItemPriceHistoryResponse | null>(null);
  const [costAnalysisVisible, setCostAnalysisVisible] = useState(false);
  const [costAnalysisLoading, setCostAnalysisLoading] = useState(false);
  const [costAnalysisData, setCostAnalysisData] = useState<BOMCostAnalysisResponse | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

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

    // 验证是否选择了物料项
    if (!selectedRowKeys || selectedRowKeys.length === 0) {
      message.warning('请至少选择一个物料项才能导出');
      return;
    }

    try {
      const itemIds = selectedRowKeys.map(key => Number(key));
      const blob = await bomApi.export(Number(id), itemIds);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BOM_${bom?.code || id}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || '导出失败';
      message.error(errorMessage);
    }
  };

  const handleViewPriceHistory = async (itemId: number) => {
    if (!id || id === 'new') return;
    setPriceHistoryVisible(true);
    setPriceHistoryLoading(true);
    try {
      const data = await bomApi.getItemPriceHistory(Number(id), itemId);
      setPriceHistoryData(data);
    } catch (error) {
      message.error('加载历史价格失败');
      setPriceHistoryVisible(false);
    } finally {
      setPriceHistoryLoading(false);
    }
  };

  const handleCalculateCost = async () => {
    if (!id || id === 'new') return;
    setCostAnalysisVisible(true);
    setCostAnalysisLoading(true);
    try {
      const data = await bomApi.calculateCost(Number(id));
      setCostAnalysisData(data);
    } catch (error) {
      message.error('计算成本价失败');
      setCostAnalysisVisible(false);
    } finally {
      setCostAnalysisLoading(false);
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
      title: '物料名称',
      dataIndex: 'material_name',
      key: 'material_name',
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => {
        if (!text) return '-';
        return <span title={text}>{text}</span>;
      },
    },
    {
      title: '规格型号',
      dataIndex: 'specification',
      key: 'specification',
      width: 250,
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => {
        if (!text) return '-';
        return <span title={text}>{text}</span>;
      },
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
      title: '物料类别',
      dataIndex: 'material_category',
      key: 'material_category',
      width: 140,
    },
    {
      title: '材质/牌号',
      dataIndex: 'material_grade',
      key: 'material_grade',
      width: 140,
    },
    {
      title: '单重（kg）',
      dataIndex: 'unit_weight',
      key: 'unit_weight',
      width: 120,
      align: 'right',
      render: (text) => {
        if (text === null || text === undefined || text === '') return '-';
        const num = typeof text === 'string' ? parseFloat(text) : text;
        return Number(num).toFixed(2);
      },
    },
    {
      title: '总重（kg）',
      dataIndex: 'total_weight',
      key: 'total_weight',
      width: 120,
      align: 'right',
      render: (text) => {
        if (text === null || text === undefined || text === '') return '-';
        const num = typeof text === 'string' ? parseFloat(text) : text;
        return Number(num).toFixed(2);
      },
    },
    {
      title: '品牌/厂家',
      dataIndex: 'brand_manufacturer',
      key: 'brand_manufacturer',
      width: 160,
    },
    {
      title: '标准号/图床',
      dataIndex: 'standard_number',
      key: 'standard_number',
      width: 160,
    },
    {
      title: '表面处理',
      dataIndex: 'surface_treatment',
      key: 'surface_treatment',
      width: 140,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 300,
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => {
        if (!text) return '-';
        return (
          <span title={text} style={{ display: 'block', wordBreak: 'break-word' }}>
            {text}
          </span>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          icon={<HistoryOutlined />}
          onClick={() => record.id && handleViewPriceHistory(record.id)}
        >
          历史价格
        </Button>
      ),
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
      <Space style={{ marginBottom: 16 }} wrap>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/boms')}>
          返回
        </Button>
        <Button onClick={() => navigate(`/boms/${bom.id}/edit`)}>
          编辑
        </Button>
        <Button
          icon={<DownloadOutlined />}
          onClick={handleExport}
          disabled={selectedRowKeys.length === 0}
        >
          导出Excel
        </Button>
        {selectedRowKeys.length > 0 && (
          <span style={{ color: '#1890ff', marginLeft: 8 }}>
            已选择 {selectedRowKeys.length} 项
          </span>
        )}
        <Button
          type="primary"
          icon={<DollarOutlined />}
          onClick={handleCalculateCost}
        >
          生成成本价
        </Button>
      </Space>

      <Card title="BOM基本信息" style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="编码">{bom.code}</Descriptions.Item>
          <Descriptions.Item label="项目名称">{bom.product_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="状态">{bom.status || '-'}</Descriptions.Item>
          <Descriptions.Item label="客户名称">{bom.customer_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="日期">
            {bom.date ? dayjs(bom.date).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="版本号">{bom.version || '-'}</Descriptions.Item>
          <Descriptions.Item label="销售渠道">{bom.sales_channel || '-'}</Descriptions.Item>
          <Descriptions.Item label="制单人">{bom.prepared_by || '-'}</Descriptions.Item>
          <Descriptions.Item label="核价人">{bom.pricing_reviewer || '-'}</Descriptions.Item>
          <Descriptions.Item label="描述">{bom.description || '-'}</Descriptions.Item>
          <Descriptions.Item label="备注">{bom.remark || '-'}</Descriptions.Item>
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
          scroll={{ x: 'max-content' }}
          rowSelection={{
            selectedRowKeys,
            onChange: (selectedKeys) => {
              setSelectedRowKeys(selectedKeys);
            },
          }}
        />
      </Card>

      {/* 当前价格Modal */}
      <Modal
        title="当前价格"
        open={priceHistoryVisible}
        onCancel={() => {
          setPriceHistoryVisible(false);
          setPriceHistoryData(null);
        }}
        footer={null}
        width={900}
      >
        <Spin spinning={priceHistoryLoading}>
          {priceHistoryData && (
            <div>
              <Descriptions column={2} style={{ marginBottom: 24 }}>
                <Descriptions.Item label="物料名称">
                  {priceHistoryData.material_name}
                </Descriptions.Item>
                <Descriptions.Item label="规格型号">
                  {priceHistoryData.specification || '-'}
                </Descriptions.Item>
                {priceHistoryData.material_match && (
                  <>
                    <Descriptions.Item label="物料编码">
                      {priceHistoryData.material_match.material_code}
                    </Descriptions.Item>
                    <Descriptions.Item label="匹配状态">
                      <Tag color="success">已匹配</Tag>
                    </Descriptions.Item>
                  </>
                )}
              </Descriptions>

              {priceHistoryData.statistics && (
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col span={6}>
                    <Statistic
                      title="平均值（成本价）"
                      value={priceHistoryData.statistics.average}
                      prefix="¥"
                      precision={2}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="最高价"
                      value={priceHistoryData.statistics.max}
                      prefix="¥"
                      precision={2}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="最低价"
                      value={priceHistoryData.statistics.min}
                      prefix="¥"
                      precision={2}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="记录数"
                      value={priceHistoryData.statistics.count}
                    />
                  </Col>
                </Row>
              )}

              {priceHistoryData.price_history.length > 0 ? (
                <div>
                  {/* 有效价格记录 */}
                  {priceHistoryData.price_history.filter((item: any) => item.price_status === 'valid').length > 0 && (
                    <>
                      <div style={{ marginBottom: 16, fontWeight: 'bold', color: '#3f8600' }}>
                        有效价格记录（纳入成本核算）
                      </div>
                      <Table
                        columns={[
                          {
                            title: '更新时间',
                            dataIndex: 'captured_at',
                            key: 'captured_at',
                            width: 180,
                            render: (text: string) => text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
                          },
                          {
                            title: '物料编号',
                            dataIndex: 'material_code',
                            key: 'material_code',
                            width: 150,
                            render: (text: string) => text || '-',
                          },
                          {
                            title: '价格',
                            dataIndex: 'unit_price',
                            key: 'unit_price',
                            width: 150,
                            align: 'right',
                            render: (text: number, record) => (
                              <div>
                                <div>{`${record.currency || 'CNY'} ${Number(text).toFixed(2)}`}</div>
                                {record.status_note && (
                                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                                    {record.status_note}
                                  </div>
                                )}
                              </div>
                            ),
                          },
                          {
                            title: '来源',
                            dataIndex: 'source',
                            key: 'source',
                            width: 180,
                            render: (text: string) => text || '-',
                          },
                          {
                            title: '物料类型',
                            dataIndex: 'material_type',
                            key: 'material_type',
                            width: 140,
                            render: (text: string) => {
                              if (!text) return '-';
                              const typeMap: Record<string, { label: string; color: string }> = {
                                'unknown': { label: '未知', color: 'default' },
                                'manual': { label: '手动录入', color: 'blue' },
                                'quotation': { label: '报价单录入', color: 'purple' },
                              };
                              const type = typeMap[text] || { label: text, color: 'default' };
                              return <Tag color={type.color}>{type.label}</Tag>;
                            },
                          },
                          {
                            title: '物料价格状态',
                            dataIndex: 'price_status',
                            key: 'price_status',
                            width: 120,
                            render: (text: string) => {
                              if (!text) return '-';
                              const statusMap: Record<string, { label: string; color: string }> = {
                                'valid': { label: '有效', color: 'success' },
                                'pending': { label: '待确认', color: 'warning' },
                                'expired': { label: '无效', color: 'default' },
                                'abnormal': { label: '异常', color: 'error' },
                              };
                              const status = statusMap[text] || { label: text, color: 'default' };
                              return <Tag color={status.color}>{status.label}</Tag>;
                            },
                          },
                        ]}
                        dataSource={priceHistoryData.price_history.filter((item: any) => item.price_status === 'valid')}
                        rowKey="id"
                        pagination={false}
                        size="small"
                      />
                    </>
                  )}

                  {/* 其他状态价格记录（仅参考） */}
                  {priceHistoryData.price_history.filter((item: any) => item.price_status === 'pending' || item.price_status === 'abnormal').length > 0 && (
                    <>
                      <div style={{ marginTop: 24, marginBottom: 16, fontWeight: 'bold', color: '#999' }}>
                        参考价格记录（不纳入成本核算）
                      </div>
                      <Table
                        columns={[
                          {
                            title: '更新时间',
                            dataIndex: 'captured_at',
                            key: 'captured_at',
                            width: 180,
                            render: (text: string) => text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
                          },
                          {
                            title: '物料编号',
                            dataIndex: 'material_code',
                            key: 'material_code',
                            width: 150,
                            render: (text: string) => text || '-',
                          },
                          {
                            title: '价格',
                            dataIndex: 'unit_price',
                            key: 'unit_price',
                            width: 150,
                            align: 'right',
                            render: (text: number, record) => (
                              <div>
                                <div>{`${record.currency || 'CNY'} ${Number(text).toFixed(2)}`}</div>
                                {record.status_note && (
                                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                                    {record.status_note}
                                  </div>
                                )}
                              </div>
                            ),
                          },
                          {
                            title: '来源',
                            dataIndex: 'source',
                            key: 'source',
                            width: 180,
                            render: (text: string) => text || '-',
                          },
                          {
                            title: '物料类型',
                            dataIndex: 'material_type',
                            key: 'material_type',
                            width: 140,
                            render: (text: string) => {
                              if (!text) return '-';
                              const typeMap: Record<string, { label: string; color: string }> = {
                                'unknown': { label: '未知', color: 'default' },
                                'manual': { label: '手动录入', color: 'blue' },
                                'quotation': { label: '报价单录入', color: 'purple' },
                              };
                              const type = typeMap[text] || { label: text, color: 'default' };
                              return <Tag color={type.color}>{type.label}</Tag>;
                            },
                          },
                          {
                            title: '物料价格状态',
                            dataIndex: 'price_status',
                            key: 'price_status',
                            width: 120,
                            render: (text: string) => {
                              if (!text) return '-';
                              const statusMap: Record<string, { label: string; color: string }> = {
                                'valid': { label: '有效', color: 'success' },
                                'pending': { label: '待确认', color: 'warning' },
                                'expired': { label: '无效', color: 'default' },
                                'abnormal': { label: '异常', color: 'error' },
                              };
                              const status = statusMap[text] || { label: text, color: 'default' };
                              return <Tag color={status.color}>{status.label}</Tag>;
                            },
                          },
                        ]}
                        dataSource={priceHistoryData.price_history.filter((item: any) => item.price_status === 'pending' || item.price_status === 'abnormal')}
                        rowKey="id"
                        pagination={false}
                        size="small"
                      />
                    </>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                  {priceHistoryData.material_match ? '暂无价格信息' : '未匹配到物料，无法查询价格'}
                </div>
              )}
            </div>
          )}
        </Spin>
      </Modal>

      {/* 成本分析Drawer */}
      <Drawer
        title="BOM成本分析报告"
        placement="right"
        size="large"
        open={costAnalysisVisible}
        onClose={() => {
          setCostAnalysisVisible(false);
          setCostAnalysisData(null);
        }}
      >
        <Spin spinning={costAnalysisLoading}>
          {costAnalysisData && (
            <div>
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={8}>
                  <Statistic
                    title="总成本价"
                    value={costAnalysisData.total_cost}
                    prefix="¥"
                    precision={2}
                    valueStyle={{ color: '#3f8600', fontSize: 24 }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="明细项"
                    value={costAnalysisData.items_count}
                    suffix="项"
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="已匹配"
                    value={costAnalysisData.matched_count}
                    suffix={`/ ${costAnalysisData.items_count} 项`}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
              </Row>

              <div style={{ marginBottom: 16 }}>
                <Tag color="success">已匹配: {costAnalysisData.matched_count}项</Tag>
                <Tag color="warning">未匹配: {costAnalysisData.unmatched_count}项</Tag>
                <Tag>历史记录: {costAnalysisData.total_price_history_count}条</Tag>
              </div>

              {costAnalysisData.unmatched_count > 0 && (
                <Alert
                  message="成本分析不完整"
                  description="部分物料未匹配到价格信息，当前总成本价仅包含已匹配物料的成本，请注意核实。"
                  type="warning"
                  showIcon
                  style={{ marginBottom: 24 }}
                />
              )}

              {/* 价格来源统计 */}
              {costAnalysisData.price_source_stats && costAnalysisData.price_source_stats.length > 0 && (
                <Card size="small" title="价格来源统计" style={{ marginBottom: 24 }}>
                  <Row gutter={24}>
                    {costAnalysisData.price_source_stats.map((stat: PriceSourceStat) => {
                      if (stat.source_type === 'unknown') return null;
                      return (
                        <Col span={12} key={stat.source_type}>
                          <div style={{ marginBottom: 8 }}>
                            <span style={{ fontWeight: 'bold' }}>
                              {stat.source_type === 'manual' ? '手动录入' :
                                stat.source_type === 'quotation' ? '报价单录入' : stat.source_type}
                            </span>
                            <span style={{ float: 'right', color: '#999' }}>
                              {Number(stat.count).toFixed(1).replace(/\.0$/, '')}项 (¥{Number(stat.total_amount).toFixed(2)})
                            </span>
                          </div>
                          <Progress
                            percent={Number(Number(stat.percentage).toFixed(1))}
                            status="active"
                            strokeColor={
                              stat.source_type === 'manual' ? '#1890ff' :
                                stat.source_type === 'quotation' ? '#722ed1' : '#d9d9d9'
                            }
                          />
                        </Col>
                      );
                    })}
                  </Row>
                </Card>
              )}

              {/* 未匹配物料汇总 */}
              {costAnalysisData.unmatched_items && costAnalysisData.unmatched_items.length > 0 && (
                <Collapse style={{ marginBottom: 24 }} defaultActiveKey={['1']}>
                  <Collapse.Panel
                    header={<span style={{ color: '#faad14' }}>未匹配物料清单 ({costAnalysisData.unmatched_items.length})</span>}
                    key="1"
                  >
                    <Table
                      columns={[
                        { title: '物料名称', dataIndex: 'material_name', key: 'material_name' },
                        { title: '规格型号', dataIndex: 'specification', key: 'specification' },
                        { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
                        { title: '单位', dataIndex: 'unit', key: 'unit', width: 80 },
                      ]}
                      dataSource={costAnalysisData.unmatched_items}
                      rowKey="item_id"
                      pagination={false}
                      size="small"
                      locale={{ emptyText: <Empty description="无未匹配物料" /> }}
                    />
                  </Collapse.Panel>
                </Collapse>
              )}

              <Table
                columns={[
                  {
                    title: '序号',
                    dataIndex: 'sequence',
                    key: 'sequence',
                    width: 80,
                  },
                  {
                    title: '物料名称',
                    dataIndex: 'material_name',
                    key: 'material_name',
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
                    title: '数量',
                    dataIndex: 'quantity',
                    key: 'quantity',
                    width: 100,
                    align: 'right',
                    render: (text: number, record) =>
                      `${Number(text).toFixed(2)} ${record.unit || ''}`,
                  },
                  {
                    title: '成本价',
                    dataIndex: 'cost_price',
                    key: 'cost_price',
                    width: 120,
                    align: 'right',
                    render: (text: number) =>
                      text ? `¥${Number(text).toFixed(2)}` : '-',
                  },
                  {
                    title: '成本小计',
                    dataIndex: 'cost_total',
                    key: 'cost_total',
                    width: 120,
                    align: 'right',
                    render: (text: number) =>
                      text ? `¥${Number(text).toFixed(2)}` : '-',
                  },
                  {
                    title: '匹配状态',
                    dataIndex: 'match_status',
                    key: 'match_status',
                    width: 100,
                    render: (text: string, record) => (
                      <Tag color={record.matched ? 'success' : 'warning'}>
                        {text}
                      </Tag>
                    ),
                  },
                  {
                    title: '历史记录',
                    dataIndex: 'price_history_count',
                    key: 'price_history_count',
                    width: 100,
                    align: 'center',
                    render: (text: number) => text || 0,
                  },
                ]}
                dataSource={costAnalysisData.items}
                rowKey="item_id"
                pagination={false}
                scroll={{ y: 400 }}
              />
            </div>
          )}
        </Spin>
      </Drawer>
    </div>
  );
};

export default BomDetail;


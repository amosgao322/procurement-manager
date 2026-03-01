import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Table, Button, Space, message, Spin, Tag, Modal, Input } from 'antd';
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { quotationApi } from '@/services/api';
import type { Quotation, QuotationItem } from '@/types';
import { hasPermission } from '@/utils/auth';
import dayjs from 'dayjs';

const { TextArea } = Input;

const QuotationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [quotation, setQuotation] = useState<Quotation | null>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await quotationApi.getById(Number(id));
      setQuotation(data);
    } catch (error) {
      message.error('加载报价单详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!id) return;
    try {
      await quotationApi.submit(Number(id));
      message.success('提交成功');
      loadData();
    } catch (error) {
      message.error('提交失败');
    }
  };

  const handleApprove = () => {
    Modal.confirm({
      title: '审批通过',
      content: (
        <div>
          <p>确定要审批通过这个报价单吗？</p>
          <TextArea rows={3} placeholder="审批意见（可选）" id="approve-comment" />
        </div>
      ),
      onOk: async () => {
        const comment = (document.getElementById('approve-comment') as HTMLTextAreaElement)?.value;
        try {
          await quotationApi.approve(Number(id!), comment);
          message.success('审批通过');
          loadData();
        } catch (error) {
          message.error('审批失败');
        }
      },
    });
  };

  const handleReject = () => {
    Modal.confirm({
      title: '拒绝报价单',
      content: (
        <div>
          <p>确定要拒绝这个报价单吗？</p>
          <TextArea rows={3} placeholder="拒绝原因（必填）" id="reject-comment" />
        </div>
      ),
      onOk: async () => {
        const comment = (document.getElementById('reject-comment') as HTMLTextAreaElement)?.value;
        if (!comment) {
          message.warning('请填写拒绝原因');
          return;
        }
        try {
          await quotationApi.reject(Number(id!), comment);
          message.success('已拒绝');
          loadData();
        } catch (error) {
          message.error('操作失败');
        }
      },
    });
  };

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个报价单吗？删除后无法恢复。',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        if (!id) return;
        try {
          await quotationApi.delete(Number(id));
          message.success('删除成功');
          navigate('/quotations');
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

  const itemColumns: ColumnsType<QuotationItem> = [
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

  if (loading) {
    return <Spin size="large" style={{ display: 'block', textAlign: 'center', marginTop: 50 }} />;
  }

  if (!quotation) {
    return <div>报价单不存在</div>;
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/quotations')}>
          返回
        </Button>
        {quotation.status === 'draft' && (
          <>
            <Button onClick={() => navigate(`/quotations/${quotation.id}/edit`)}>
              编辑
            </Button>
            <Button type="primary" onClick={handleSubmit}>
              提交审批
            </Button>
            {hasPermission('quotation:delete') && (
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                删除
              </Button>
            )}
          </>
        )}
        {quotation.status === 'submitted' && (
          <>
            <Button type="primary" icon={<CheckOutlined />} onClick={handleApprove}>
              审批通过
            </Button>
            <Button danger icon={<CloseOutlined />} onClick={handleReject}>
              拒绝
            </Button>
          </>
        )}
      </Space>

      <Card title="报价单基本信息" style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="编码">{quotation.code}</Descriptions.Item>
          <Descriptions.Item label="状态">{getStatusTag(quotation.status)}</Descriptions.Item>
          <Descriptions.Item label="BOM">{quotation.bom?.product_name || quotation.bom?.code || '-'}</Descriptions.Item>
          <Descriptions.Item label="供应商">{quotation.supplier?.name || '-'}</Descriptions.Item>
          <Descriptions.Item label="总金额">
            {quotation.total_amount ? `¥${Number(quotation.total_amount).toFixed(2)}` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="交期（天）">{quotation.delivery_days || '-'}</Descriptions.Item>
          <Descriptions.Item label="有效期至">
            {quotation.valid_until ? dayjs(quotation.valid_until).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {quotation.created_at ? dayjs(quotation.created_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="备注" span={2}>{quotation.remark || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="报价明细">
        <Table
          columns={itemColumns}
          dataSource={quotation.items || []}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default QuotationDetail;


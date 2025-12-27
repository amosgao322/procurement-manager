import { useState, useEffect } from 'react';
import { Table, Button, Space, message, Tag, Modal, Input, Tabs, Form, Select, DatePicker } from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { quotationApi, contractApi, contractTemplateApi } from '@/services/api';
import type { Quotation, ContractTemplate, GenerateContractRequest } from '@/types';
import dayjs from 'dayjs';

const { TextArea } = Input;

const Approval: React.FC = () => {
  const [data, setData] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' 我的审批, 'approved' 已审批
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [generateContractModalVisible, setGenerateContractModalVisible] = useState(false);
  const [currentQuotation, setCurrentQuotation] = useState<Quotation | null>(null);
  const [comment, setComment] = useState('');
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [generateForm] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [page, pageSize, activeTab]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        page_size: pageSize,
      };
      
      // 我的审批：只显示待审批状态（submitted）的报价单
      if (activeTab === 'pending') {
        params.status = 'submitted';
      } 
      // 已审批：显示已审批和已拒绝的报价单
      else if (activeTab === 'approved') {
        params.status_in = 'approved,rejected';
      }
      
      const response = await quotationApi.getList(params);
      // 额外的前端过滤，确保数据正确
      let filteredItems = response.items;
      if (activeTab === 'pending') {
        // 我的审批：只显示待审批的
        filteredItems = response.items.filter(item => item.status === 'submitted');
      } else if (activeTab === 'approved') {
        // 已审批：只显示已审批和已拒绝的
        filteredItems = response.items.filter(
          item => item.status === 'approved' || item.status === 'rejected'
        );
      }
      
      setData(filteredItems);
      setTotal(filteredItems.length);
    } catch (error) {
      message.error('加载报价单失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      draft: { color: 'default', text: '草稿' },
      submitted: { color: 'processing', text: '待审批' },
      approved: { color: 'success', text: '已审批' },
      rejected: { color: 'error', text: '已拒绝' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const handleApprove = (quotation: Quotation) => {
    setCurrentQuotation(quotation);
    setComment('');
    setApproveModalVisible(true);
  };

  const handleReject = (quotation: Quotation) => {
    setCurrentQuotation(quotation);
    setComment('');
    setRejectModalVisible(true);
  };

  const confirmApprove = async () => {
    if (!currentQuotation) return;
    try {
      await quotationApi.approve(currentQuotation.id!, comment || undefined);
      message.success('审批通过');
      setApproveModalVisible(false);
      setComment('');
      setPage(1); // 重置到第一页
      loadData();
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '审批失败');
    }
  };

  const confirmReject = async () => {
    if (!currentQuotation) return;
    if (!comment.trim()) {
      message.warning('请输入拒绝原因');
      return;
    }
    try {
      await quotationApi.reject(currentQuotation.id!, comment);
      message.success('已拒绝');
      setRejectModalVisible(false);
      setComment('');
      setPage(1); // 重置到第一页
      loadData();
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '操作失败');
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await contractTemplateApi.getList({ is_active: true });
      setTemplates(response.items);
    } catch (error) {
      console.error('加载模板列表失败', error);
    }
  };

  const handleGenerateContract = (quotation: Quotation) => {
    if (quotation.status !== 'approved') {
      message.warning('只有已审批通过的报价单才能生成合同');
      return;
    }
    setCurrentQuotation(quotation);
    generateForm.setFieldsValue({
      quotation_id: quotation.id,
      contract_code: `HT${quotation.code}`,
      contract_title: quotation.title,
    });
    setGenerateContractModalVisible(true);
  };

  const confirmGenerateContract = async () => {
    try {
      const values = await generateForm.validateFields();
      const request: GenerateContractRequest = {
        quotation_id: values.quotation_id,
        template_id: values.template_id,
        contract_code: values.contract_code,
        contract_title: values.contract_title,
        sign_date: values.sign_date ? values.sign_date.format('YYYY-MM-DD') : undefined,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : undefined,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : undefined,
      };
      
      await contractApi.generate(request);
      message.success('合同生成成功');
      setGenerateContractModalVisible(false);
      generateForm.resetFields();
      navigate('/contracts');
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '生成合同失败');
    }
  };

  const columns: ColumnsType<Quotation> = [
    {
      title: '编码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
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
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: activeTab === 'pending' ? 250 : 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/quotations/${record.id}`)}
          >
            查看
          </Button>
          {activeTab === 'pending' && (
            <>
              <Button
                type="link"
                danger={false}
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record)}
              >
                审批通过
              </Button>
              <Button
                type="link"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleReject(record)}
              >
                拒绝
              </Button>
            </>
          )}
          {activeTab === 'approved' && record.status === 'approved' && (
            <Button
              type="link"
              icon={<FileTextOutlined />}
              onClick={() => handleGenerateContract(record)}
            >
              生成合同
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'pending',
      label: '我的审批',
    },
    {
      key: 'approved',
      label: '已审批',
    },
  ];

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        items={tabItems}
        onChange={(key) => {
          setActiveTab(key);
          setPage(1); // 切换tab时重置到第一页
        }}
        style={{ marginBottom: 16 }}
      />
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

      <Modal
        title="审批通过"
        open={approveModalVisible}
        onOk={confirmApprove}
        onCancel={() => {
          setApproveModalVisible(false);
          setComment('');
        }}
        okText="确认通过"
        cancelText="取消"
      >
        <p>确定要审批通过此报价单吗？</p>
        <TextArea
          placeholder="审批意见（可选）"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </Modal>

      <Modal
        title="拒绝报价单"
        open={rejectModalVisible}
        onOk={confirmReject}
        onCancel={() => {
          setRejectModalVisible(false);
          setComment('');
        }}
        okText="确认拒绝"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>确定要拒绝此报价单吗？</p>
        <TextArea
          placeholder="请输入拒绝原因（必填）"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
        />
      </Modal>

      <Modal
        title="生成合同"
        open={generateContractModalVisible}
        onOk={confirmGenerateContract}
        onCancel={() => {
          setGenerateContractModalVisible(false);
          generateForm.resetFields();
        }}
        okText="生成"
        cancelText="取消"
        width={600}
      >
        <Form form={generateForm} layout="vertical">
          <Form.Item name="quotation_id" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="template_id"
            label="合同模板"
            rules={[{ required: true, message: '请选择合同模板' }]}
          >
            <Select placeholder="请选择合同模板">
              {templates.map(template => (
                <Select.Option key={template.id} value={template.id}>
                  {template.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="contract_code"
            label="合同编号"
            rules={[{ required: true, message: '请输入合同编号' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="contract_title"
            label="合同标题"
            rules={[{ required: true, message: '请输入合同标题' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="sign_date"
            label="签订日期"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="start_date"
            label="生效日期"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="end_date"
            label="到期日期"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Approval;


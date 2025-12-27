import { useState, useEffect } from 'react';
import { Table, Button, Input, Space, message, Modal, Form, Upload, Switch, Popconfirm } from 'antd';
import { PlusOutlined, SearchOutlined, UploadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { contractTemplateApi } from '@/services/api';
import type { ContractTemplate } from '@/types';
import dayjs from 'dayjs';

const ContractTemplateList: React.FC = () => {
  const [data, setData] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const [form] = Form.useForm();
  const [uploadForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [page, pageSize, keyword]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await contractTemplateApi.getList({
        page,
        page_size: pageSize,
        keyword: keyword || undefined,
      });
      setData(response.items);
      setTotal(response.total);
    } catch (error) {
      message.error('加载模板列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setKeyword(value);
    setPage(1);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    uploadForm.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: ContractTemplate) => {
    setEditingTemplate(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      is_active: record.is_active,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await contractTemplateApi.delete(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingTemplate) {
        await contractTemplateApi.update(editingTemplate.id!, values);
        message.success('更新成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleUpload = async () => {
    try {
      const values = await uploadForm.validateFields();
      console.log('表单值:', values);
      
      const formData = new FormData();
      formData.append('name', values.name);
      if (values.description) {
        formData.append('description', values.description);
      }
      if (values.file && values.file.fileList && values.file.fileList.length > 0) {
        formData.append('file', values.file.fileList[0].originFileObj);
      }
      
      // 调试：打印 FormData 内容
      console.log('FormData 内容:');
      for (const [key, value] of formData.entries()) {
        console.log(key, ':', value instanceof File ? `File: ${value.name}` : value);
      }

      await contractTemplateApi.create(formData);
      message.success('上传成功');
      setModalVisible(false);
      uploadForm.resetFields();
      loadData();
    } catch (error: any) {
      console.error('上传错误:', error);
      message.error(error.response?.data?.detail || '上传失败');
    }
  };

  const handleStatusChange = async (record: ContractTemplate, checked: boolean) => {
    try {
      await contractTemplateApi.update(record.id!, { is_active: checked });
      message.success('状态更新成功');
      loadData();
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  const columns: ColumnsType<ContractTemplate> = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '文件名',
      dataIndex: 'file_name',
      key: 'file_name',
    },
    {
      title: '文件大小',
      dataIndex: 'file_size',
      key: 'file_size',
      render: (size: number) => {
        if (!size) return '-';
        const kb = size / 1024;
        if (kb < 1024) {
          return `${kb.toFixed(2)} KB`;
        }
        return `${(kb / 1024).toFixed(2)} MB`;
      },
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean, record: ContractTemplate) => (
        <Switch
          checked={isActive}
          onChange={(checked) => handleStatusChange(record, checked)}
        />
      ),
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
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个模板吗？"
            onConfirm={() => handleDelete(record.id!)}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="搜索模板名称"
          allowClear
          style={{ width: 300 }}
          onSearch={handleSearch}
          enterButton={<SearchOutlined />}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          上传模板
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

      <Modal
        title={editingTemplate ? '编辑模板' : '上传模板'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          uploadForm.resetFields();
        }}
        onOk={editingTemplate ? handleSubmit : handleUpload}
        width={600}
      >
        {editingTemplate ? (
          <Form form={form} layout="vertical">
            <Form.Item
              name="name"
              label="模板名称"
              rules={[{ required: true, message: '请输入模板名称' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="description"
              label="描述"
            >
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item
              name="is_active"
              label="是否启用"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Form>
        ) : (
          <Form form={uploadForm} layout="vertical">
            <Form.Item
              name="name"
              label="模板名称"
              rules={[{ required: true, message: '请输入模板名称' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="description"
              label="描述"
            >
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item
              name="file"
              label="模板文件"
              rules={[{ required: true, message: '请选择模板文件' }]}
            >
              <Upload
                beforeUpload={() => false}
                accept=".docx,.doc"
                maxCount={1}
              >
                <Button icon={<UploadOutlined />}>选择文件</Button>
              </Upload>
            </Form.Item>
            <div style={{ color: '#999', fontSize: '12px', marginTop: -16 }}>
              支持的格式：.docx, .doc
            </div>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default ContractTemplateList;


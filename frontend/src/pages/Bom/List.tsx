import { useState, useEffect } from 'react';
import { Table, Button, Input, Space, message, Modal, Upload } from 'antd';
import { PlusOutlined, SearchOutlined, UploadOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { bomApi } from '@/services/api';
import type { Bom } from '@/types';
import dayjs from 'dayjs';

const BomList: React.FC = () => {
  const [data, setData] = useState<Bom[]>([]);
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
      const response = await bomApi.getList({
        page,
        page_size: pageSize,
        keyword: keyword || undefined,
      });
      setData(response.items);
      setTotal(response.total);
    } catch (error) {
      message.error('加载BOM列表失败');
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
      content: '确定要删除这个BOM吗？',
      onOk: async () => {
        try {
          await bomApi.delete(id);
          message.success('删除成功');
          loadData();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleImport = async (file: File) => {
    // 验证文件类型
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      message.error('只支持Excel文件(.xlsx, .xls)');
      return false;
    }
    
    // 验证文件大小（最大10MB）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      message.error(`文件大小超过限制（${(file.size / 1024 / 1024).toFixed(2)}MB），最大支持10MB`);
      return false;
    }
    
    if (file.size === 0) {
      message.error('文件为空，请选择有效的Excel文件');
      return false;
    }
    
    try {
      const response = await bomApi.import(file);
      if (response.success) {
        message.success(`导入成功！共 ${response.success_rows}/${response.total_rows} 条数据`);
        if (response.errors && response.errors.length > 0) {
          Modal.warning({
            title: '导入警告',
            width: 600,
            content: (
              <div>
                <p>部分数据导入失败：</p>
                <ul>
                  {response.errors.map((err, idx) => (
                    <li key={idx}>
                      第{err.row}行，{err.field}：{err.message}
                    </li>
                  ))}
                </ul>
              </div>
            ),
          });
        }
        loadData();
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.detail || error?.message || '导入失败';
      
      // 显示详细的错误信息弹窗
      Modal.error({
        title: '导入失败',
        width: 700,
        content: (
          <div style={{ whiteSpace: 'pre-wrap', maxHeight: '500px', overflow: 'auto' }}>
            <div style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 8, fontWeight: 'bold', color: '#ff4d4f' }}>错误详情：</p>
              <div style={{ 
                padding: 12, 
                background: '#fff2f0', 
                border: '1px solid #ffccc7',
                borderRadius: 4,
                color: '#ff4d4f'
              }}>
                {errorMsg.split('\n').map((line: string, idx: number) => (
                  <div key={idx} style={{ marginBottom: 4 }}>{line}</div>
                ))}
              </div>
            </div>
            
            <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <p style={{ marginBottom: 8, fontWeight: 'bold' }}>文件信息：</p>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>文件名：{file.name}</li>
                <li>文件大小：{(file.size / 1024).toFixed(2)} KB</li>
                <li>文件类型：{file.type || '未知'}</li>
                <li>最后修改：{new Date(file.lastModified).toLocaleString('zh-CN')}</li>
              </ul>
            </div>
            
            <div style={{ marginTop: 12, padding: 12, background: '#e6f7ff', borderRadius: 4 }}>
              <p style={{ marginBottom: 8, fontWeight: 'bold' }}>解决建议：</p>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>确认文件是使用Microsoft Excel或兼容软件创建的</li>
                <li>尝试在Excel中打开文件，确认文件可以正常打开</li>
                <li>如果文件可以打开，尝试另存为新文件后再导入</li>
                <li>检查文件是否损坏或不完整</li>
                <li>确认文件扩展名正确（.xlsx 或 .xls）</li>
                <li>如果是从其他格式转换的，请确保转换过程正确</li>
              </ul>
            </div>
          </div>
        ),
      });
    }
    return false; // 阻止自动上传
  };

  const handleExport = async (id: number) => {
    try {
      const blob = await bomApi.export(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // 从响应头获取文件名，如果没有则使用默认名称
      const contentDisposition = blob.type; // 这里可能需要从响应头获取
      a.download = `BOM_${id}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const columns: ColumnsType<Bom> = [
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
      title: '产品名称',
      dataIndex: 'product_name',
      key: 'product_name',
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
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/boms/${record.id}`)}
          >
            查看
          </Button>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleExport(record.id!)}
          >
            导出
          </Button>
          <Button
            type="link"
            danger
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
      <Space style={{ marginBottom: 16, width: '100%' }} direction="vertical" size="middle">
        <Space>
          <Input.Search
            placeholder="搜索BOM编码或名称"
            allowClear
            style={{ width: 300 }}
            onSearch={handleSearch}
            enterButton={<SearchOutlined />}
          />
          <Upload
            accept=".xlsx,.xls"
            showUploadList={false}
            beforeUpload={handleImport}
          >
            <Button icon={<UploadOutlined />}>导入Excel</Button>
          </Upload>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/boms/new')}>
            新建BOM
          </Button>
        </Space>
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

export default BomList;


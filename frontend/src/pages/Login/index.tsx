import { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/services/api';
import { setToken, setUser } from '@/utils/auth';
import type { LoginRequest } from '@/types';
import './index.css';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: LoginRequest) => {
    setLoading(true);
    try {
      const response = await authApi.login(values);
      setToken(response.access_token);
      setUser(response.user);
      message.success('登录成功');
      navigate('/');
    } catch (error: any) {
      // 处理错误提示
      let errorMessage = '用户名或密码错误';
      
      if (error?.response?.data) {
        // 从响应数据中获取错误信息
        errorMessage = error.response.data.detail || error.response.data.message || errorMessage;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card" bordered={false}>
        <div className="login-header">
          <img src="/logo-icon.svg" alt="永业环境" className="login-logo" />
          <Title level={3} className="login-title">永业环境采购管理系统</Title>
          <Text type="secondary" className="login-subtitle">湖南永业环境科技有限公司</Text>
        </div>
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;


import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, message } from 'antd';
import type { MenuProps } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FileTextOutlined,
  ShopOutlined,
  DollarOutlined,
  FileDoneOutlined,
  BarChartOutlined,
  LogoutOutlined,
  UserOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { clearAuth, getUser } from '@/utils/auth';
import { authApi } from '@/services/api';
import type { User } from '@/types';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const userInfo = await authApi.getCurrentUser();
      setUser(userInfo);
    } catch (error) {
      console.error('获取用户信息失败', error);
    }
  };

  const handleLogout = () => {
    clearAuth();
    message.success('已退出登录');
    navigate('/login');
  };

  const menuItems: MenuProps['items'] = [
    {
      key: '/boms',
      icon: <FileTextOutlined />,
      label: 'BOM管理',
    },
    {
      key: '/suppliers',
      icon: <ShopOutlined />,
      label: '供应商管理',
    },
    {
      key: '/quotations',
      icon: <DollarOutlined />,
      label: '报价管理',
    },
    {
      key: '/approval',
      icon: <CheckCircleOutlined />,
      label: '审批管理',
    },
    {
      key: '/contracts',
      icon: <FileDoneOutlined />,
      label: '合同管理',
    },
    {
      key: '/contract-templates',
      icon: <FileTextOutlined />,
      label: '合同模板',
    },
    {
      key: '/comparison',
      icon: <BarChartOutlined />,
      label: '询比价',
    },
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user',
      icon: <UserOutlined />,
      label: user?.real_name || user?.username || '用户',
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div
          style={{
            height: 32,
            margin: 16,
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
          }}
        >
          {collapsed ? '采购' : '采购管理系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 16px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{ fontSize: 18, cursor: 'pointer' }}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.real_name || user?.username || '用户'}</span>
            </div>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '16px',
            padding: 24,
            minHeight: 280,
            background: '#fff',
            borderRadius: 4,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;


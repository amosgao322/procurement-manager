import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, message } from 'antd';
import type { MenuProps } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FileTextOutlined,
  DollarOutlined,
  FileDoneOutlined,
  LogoutOutlined,
  UserOutlined,
  TeamOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { clearAuth, hasPermission } from '@/utils/auth';
import { authApi } from '@/services/api';
import type { User } from '@/types';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // 根据当前路径自动展开对应的父菜单
  const getOpenKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/quotations') || path.startsWith('/approval') || path.startsWith('/comparison') || path.startsWith('/suppliers')) {
      return ['quotation'];
    }
    if (path.startsWith('/contracts') || path.startsWith('/contract-templates')) {
      return ['contract'];
    }
    if (path.startsWith('/users')) {
      return ['system'];
    }
    return [];
  };
  
  const [openKeys, setOpenKeys] = useState<string[]>(getOpenKeys());

  useEffect(() => {
    loadUserInfo();
  }, []);

  useEffect(() => {
    setOpenKeys(getOpenKeys());
  }, [location.pathname]);

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

  // 根据权限过滤菜单项
  const allMenuItems: Array<any> = [
    {
      key: '/boms',
      icon: <FileTextOutlined />,
      label: 'BOM管理',
      permission: 'bom:view',
    },
    {
      key: 'quotation',
      icon: <DollarOutlined />,
      label: '报价管理',
      permission: 'quotation:view',
      children: [
        {
          key: '/quotations',
          label: '报价单列表',
          permission: 'quotation:view',
        },
        {
          key: '/approval',
          label: '报价单审批',
          permission: 'quotation:approve',
        },
        {
          key: '/suppliers',
          label: '供应商列表',
          permission: 'supplier:view',
        },
        {
          key: '/comparison',
          label: '询比价',
          permission: 'quotation:view',
        },
      ],
    },
    {
      key: '/materials',
      icon: <DatabaseOutlined />,
      label: '物料库管理',
      permission: 'material:view',
    },
    {
      key: 'contract',
      icon: <FileDoneOutlined />,
      label: '合同管理',
      permission: 'contract:view',
      children: [
        {
          key: '/contracts',
          label: '合同列表',
          permission: 'contract:view',
        },
        {
          key: '/contract-templates',
          label: '合同模板',
          permission: 'contract:view',
        },
      ],
    },
    {
      key: 'system',
      icon: <TeamOutlined />,
      label: '系统管理',
      permission: 'user:view',
      children: [
        {
          key: '/users',
          label: '用户列表',
          permission: 'user:view',
        },
      ],
    },
  ];
  
  // 递归过滤菜单项：只显示有权限的菜单
  const filterMenuItems = (items: Array<any>): Array<any> => {
    return items
      .filter((item) => {
        if (!item.permission) return true;  // 没有权限要求的菜单项始终显示
        return hasPermission(item.permission);
      })
      .map(({ permission, children, ...item }) => {
        const filteredItem: any = { ...item };
        // 如果有子菜单，递归过滤
        if (children && Array.isArray(children)) {
          const filteredChildren = filterMenuItems(children);
          // 如果子菜单都被过滤掉了，且父菜单也没有权限，则不显示父菜单
          if (filteredChildren.length > 0) {
            filteredItem.children = filteredChildren;
          } else if (permission && !hasPermission(permission)) {
            return null; // 父菜单没有权限且没有子菜单，不显示
          }
        }
        return filteredItem;
      })
      .filter(item => item !== null);
  };
  
  const menuItems = filterMenuItems(allMenuItems) as MenuProps['items'];

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
            height: collapsed ? 64 : 90,
            margin: 16,
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: 4,
            display: 'flex',
            flexDirection: collapsed ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            padding: collapsed ? '8px' : '12px 16px',
            gap: collapsed ? '4px' : '12px',
          }}
        >
          <img 
            src="/logo-icon.svg" 
            alt="永业环境" 
            style={{ 
              width: collapsed ? '40px' : '50px',
              height: collapsed ? '40px' : '50px',
              objectFit: 'contain',
              flexShrink: 0
            }} 
          />
          {!collapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', flex: 1 }}>
              <span style={{ fontSize: 16, lineHeight: '1.3', fontWeight: 600 }}>永业环境</span>
              <span style={{ fontSize: 12, opacity: 0.9, fontWeight: 'normal', lineHeight: '1.3' }}>采购管理系统</span>
            </div>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          openKeys={openKeys}
          onOpenChange={setOpenKeys}
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


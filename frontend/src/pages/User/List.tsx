import { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  message,
  Modal,
  Tag,
  Select,
  Form,
  Drawer,
  Switch,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { userApi } from '@/services/api';
import type { UserListItem, UserCreate, RoleInfo, PermissionInfo } from '@/types';
import { hasPermission } from '@/utils/auth';
import dayjs from 'dayjs';

const { Option, OptGroup } = Select;

const UserList: React.FC = () => {
  const [data, setData] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>();
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [permissions, setPermissions] = useState<PermissionInfo[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [form] = Form.useForm();

  const permissionCodeToName = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of permissions) map.set(p.code, p.name);
    return map;
  }, [permissions]);

  const permissionGroups = useMemo(() => {
    const groups = new Map<string, PermissionInfo[]>();
    for (const p of permissions) {
      const key = p.resource || '其他';
      const arr = groups.get(key) || [];
      arr.push(p);
      groups.set(key, arr);
    }
    // sort group keys and items for stable UI
    const sortedKeys = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b, 'zh-CN'));
    return sortedKeys.map((key) => ({
      key,
      items: (groups.get(key) || []).slice().sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')),
    }));
  }, [permissions]);

  useEffect(() => {
    loadRoles();
    loadPermissions();
    loadData();
  }, [page, pageSize, search, roleFilter, activeFilter]);

  const loadRoles = async () => {
    try {
      const response = await userApi.getRoles();
      // 只显示三个角色：管理员、技术员、采购员
      const filteredRoles = response.items.filter(
        role => role.code === 'admin' || role.code === 'technician' || role.code === 'purchaser'
      );
      setRoles(filteredRoles);
    } catch (error) {
      console.error('加载角色列表失败', error);
    }
  };

  const loadPermissions = async () => {
    try {
      const response = await userApi.getPermissions();
      setPermissions(response.items);
    } catch (error) {
      console.error('加载权限列表失败', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await userApi.getList({
        skip: (page - 1) * pageSize,
        limit: pageSize,
        search: search || undefined,
        role_code: roleFilter,
        is_active: activeFilter,
      });
      setData(response.items);
      setTotal(response.total);
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    try {
      await userApi.delete(id);
      message.success('删除成功');
      loadData();
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '删除失败');
    }
  };

  const handleEdit = async (user: UserListItem) => {
    setEditingUser(user);
    try {
      // 获取用户详情以获取权限信息
      const userDetail = await userApi.getById(user.id);
      form.setFieldsValue({
        real_name: userDetail.real_name,
        email: userDetail.email,
        phone: userDetail.phone,
        is_active: userDetail.is_active,
        role_codes: userDetail.roles.map((role) => role.code),
        permission_codes: userDetail.permissions?.map((perm) => perm.code) || [],
      });
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '加载用户详情失败');
      // 如果加载失败，使用列表数据
      form.setFieldsValue({
        real_name: user.real_name,
        email: user.email,
        phone: user.phone,
        is_active: user.is_active,
        role_codes: user.roles.map((roleName) => {
          const role = roles.find((r) => r.name === roleName);
          return role?.code;
        }).filter(Boolean),
        permission_codes: [],
      });
    }
    setDrawerVisible(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({
      role_codes: [],
      permission_codes: [],
      is_active: true,
    });
    setDrawerVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        // 更新用户
        await userApi.update(editingUser.id, values);
        message.success('更新成功');
      } else {
        // 创建用户
        if (!values.password) {
          message.error('请输入密码');
          return;
        }
        await userApi.create(values as UserCreate);
        message.success('创建成功');
      }
      setDrawerVisible(false);
      loadData();
    } catch (error: any) {
      if (error?.errorFields) {
        return; // 表单验证错误
      }
      message.error(error?.response?.data?.detail || '操作失败');
    }
  };

  const handleResetPassword = async (id: number) => {
    Modal.confirm({
      title: '重置密码',
      content: (
        <Input.Password
          placeholder="请输入新密码"
          id="new-password-input"
          onPressEnter={(e) => {
            const target = e.target as HTMLInputElement;
            if (target.value.length >= 6) {
              Modal.destroyAll();
              userApi.updatePassword(id, target.value).then(() => {
                message.success('密码重置成功');
              }).catch((err: any) => {
                message.error(err?.response?.data?.detail || '密码重置失败');
              });
            } else {
              message.warning('密码长度至少6位');
            }
          }}
        />
      ),
      onOk: () => {
        const input = document.getElementById('new-password-input') as HTMLInputElement;
        if (!input || input.value.length < 6) {
          message.warning('密码长度至少6位');
          return Promise.reject();
        }
        return userApi.updatePassword(id, input.value).then(() => {
          message.success('密码重置成功');
        });
      },
    });
  };

  const columns: ColumnsType<UserListItem> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      width: 150,
    },
    {
      title: '真实姓名',
      dataIndex: 'real_name',
      width: 120,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 180,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 120,
    },
    {
      title: '角色',
      dataIndex: 'roles',
      width: 200,
      render: (roles: string[]) => (
        <Space wrap>
          {roles.map((role) => (
            <Tag key={role} color="blue">
              {role}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '激活' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_: any, record: UserListItem) => (
        <Space>
          {hasPermission('user:update') && (
            <>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
              <Button
                type="link"
                icon={<LockOutlined />}
                onClick={() => handleResetPassword(record.id)}
              >
                重置密码
              </Button>
            </>
          )}
          {hasPermission('user:delete') && (
            <Popconfirm
              title="确认删除"
              description="确定要删除这个用户吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="搜索用户名或真实姓名"
          allowClear
          style={{ width: 250 }}
          onSearch={handleSearch}
          enterButton={<SearchOutlined />}
        />
        <Select
          placeholder="筛选角色"
          allowClear
          style={{ width: 150 }}
          value={roleFilter}
          onChange={setRoleFilter}
        >
          {roles.map((role) => (
            <Option key={role.code} value={role.code}>
              {role.name}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="筛选状态"
          allowClear
          style={{ width: 120 }}
          value={activeFilter}
          onChange={setActiveFilter}
        >
          <Option value={true}>激活</Option>
          <Option value={false}>禁用</Option>
        </Select>
        {hasPermission('user:create') && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            创建用户
          </Button>
        )}
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
        scroll={{ x: 1200 }}
      />

      <Drawer
        title={editingUser ? '编辑用户' : '创建用户'}
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={() => setDrawerVisible(false)}>取消</Button>
            <Button 
              type="primary" 
              onClick={handleSubmit}
              disabled={
                editingUser 
                  ? !hasPermission('user:update') 
                  : !hasPermission('user:create')
              }
            >
              确定
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            is_active: true,
            role_codes: [],
            permission_codes: [],
          }}
        >
          {!editingUser && (
            <Form.Item
              label="用户名"
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' },
                { max: 50, message: '用户名最多50个字符' },
              ]}
            >
              <Input placeholder="请输入用户名" />
            </Form.Item>
          )}

          {!editingUser && (
            <Form.Item
              label="密码"
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' },
              ]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}

          <Form.Item
            label="真实姓名"
            name="real_name"
          >
            <Input placeholder="请输入真实姓名（可选）" />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            label="手机号"
            name="phone"
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item
            label="角色"
            name="role_codes"
            rules={[{ required: true, message: '请至少选择一个角色' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择角色"
              showSearch
              filterOption={(input, option) => {
                const children = option?.children;
                const text = typeof children === 'string' ? children : 
                           Array.isArray(children) ? children.join('') : 
                           String(children || '');
                return text.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {roles.map((role) => (
                <Option key={role.code} value={role.code}>
                  {role.name} - {role.description}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="权限"
            name="permission_codes"
            tooltip="为用户分配具体权限，这些权限会叠加在角色权限之上"
          >
            <Select
              mode="multiple"
              placeholder="请选择权限（可选）"
              showSearch
              optionLabelProp="label"
              maxTagCount="responsive"
              maxTagPlaceholder={(omittedValues) => `已选 ${omittedValues.length} 项`}
              tagRender={(props) => {
                const { label, value, closable, onClose } = props;
                const name = (typeof label === 'string' && label) || permissionCodeToName.get(String(value)) || String(value);
                return (
                  <Tag
                    color="blue"
                    style={{ marginInlineEnd: 4, borderRadius: 12, paddingInline: 8 }}
                    closable={closable}
                    onClose={onClose}
                  >
                    {name}
                  </Tag>
                );
              }}
              filterOption={(input, option) => {
                const label = (option as any)?.label as string | undefined;
                return (label || '').toLowerCase().includes(input.toLowerCase());
              }}
              style={{ width: '100%' }}
            >
              {permissionGroups.map((group) => (
                <OptGroup key={group.key} label={group.key}>
                  {group.items.map((perm) => (
                    <Option key={perm.code} value={perm.code} label={perm.name}>
                      {perm.name}
                    </Option>
                  ))}
                </OptGroup>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="状态"
            name="is_active"
            valuePropName="checked"
          >
            <Switch checkedChildren="激活" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default UserList;


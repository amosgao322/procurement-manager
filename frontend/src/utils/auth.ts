const TOKEN_KEY = 'procurement_token';
const USER_KEY = 'procurement_user';

export interface StoredUser {
  id: number;
  username: string;
  real_name: string;
  roles: string[];
}

// Token管理
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// 用户信息管理
export const setUser = (user: StoredUser): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = (): StoredUser | null => {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const removeUser = (): void => {
  localStorage.removeItem(USER_KEY);
};

// 清除所有认证信息
export const clearAuth = (): void => {
  removeToken();
  removeUser();
};

// 检查是否有权限
export const hasPermission = (_permission: string): boolean => {
  const user = getUser();
  if (!user) return false;
  
  // 管理员拥有所有权限
  if (user.roles.includes('管理员') || user.roles.includes('admin')) {
    return true;
  }
  
  // 这里可以根据实际需求扩展权限检查逻辑
  return false;
};

// 检查是否有角色
export const hasRole = (role: string): boolean => {
  const user = getUser();
  if (!user) return false;
  return user.roles.includes(role);
};


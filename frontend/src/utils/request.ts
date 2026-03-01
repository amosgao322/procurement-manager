import axios, { AxiosInstance, AxiosError } from 'axios';
import { message } from 'antd';
import { getToken, removeToken } from './auth';

// 创建axios实例
const request: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // 如果是FormData，移除Content-Type让浏览器自动设置（包括boundary）
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error: AxiosError) => {
    if (error.response) {
      const { status, data, config } = error.response;
      
      // 登录接口的401错误不在这里处理，让登录页面自己处理
      const isLoginRequest = config?.url?.includes('/auth/login');
      
      switch (status) {
        case 401:
          if (!isLoginRequest) {
            // 非登录接口的401错误才跳转
            message.error('未授权，请重新登录');
            removeToken();
            window.location.href = '/login';
          }
          // 登录接口的401错误不显示通用提示，让登录页面显示具体错误
          break;
        case 403:
          message.error('没有权限访问');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器错误');
          break;
        default:
          // 登录接口的错误不在这里显示，让登录页面显示
          if (!isLoginRequest) {
            const errorMessage = (data as any)?.detail || (data as any)?.message || '请求失败';
            message.error(errorMessage);
          }
      }
    } else if (error.request) {
      message.error('网络错误，请检查网络连接');
    } else {
      message.error('请求配置错误');
    }
    
    return Promise.reject(error);
  }
);

export default request;


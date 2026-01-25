import { Navigate } from 'react-router-dom';
import { getToken, hasPermission } from '@/utils/auth';

interface PermissionRouteProps {
  children: React.ReactElement;
  permission: string;
}

const PermissionRoute: React.FC<PermissionRouteProps> = ({ children, permission }) => {
  const token = getToken();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (!hasPermission(permission)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default PermissionRoute;


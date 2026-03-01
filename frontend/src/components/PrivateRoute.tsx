import { Navigate } from 'react-router-dom';
import { getToken } from '@/utils/auth';

interface PrivateRouteProps {
  children: React.ReactElement;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const token = getToken();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default PrivateRoute;


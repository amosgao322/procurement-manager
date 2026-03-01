import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MaterialFormModal from './Form';

/**
 * 物料表单页面组件（用于路由）
 * 包装MaterialFormModal以支持路由导航
 */
const MaterialFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [open, setOpen] = useState(true);
  const materialId = id && id !== 'new' ? Number(id) : undefined;

  useEffect(() => {
    setOpen(true);
  }, [id]);

  const handleCancel = () => {
    setOpen(false);
    navigate('/materials');
  };

  const handleSuccess = () => {
    // 成功后已经在Modal内部处理了导航
  };

  return (
    <MaterialFormModal
      open={open}
      onCancel={handleCancel}
      onSuccess={handleSuccess}
      materialId={materialId}
    />
  );
};

export default MaterialFormPage;


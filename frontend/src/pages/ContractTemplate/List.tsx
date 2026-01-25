import { Result } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';

const ContractTemplateList: React.FC = () => {
  return (
    <Result
      icon={<FileTextOutlined style={{ color: '#1890ff' }} />}
      title="功能暂未实现"
      subTitle="敬请期待"
    />
  );
};

export default ContractTemplateList;


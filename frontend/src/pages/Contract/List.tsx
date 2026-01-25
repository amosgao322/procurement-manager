import { Result } from 'antd';
import { FileDoneOutlined } from '@ant-design/icons';

const ContractList: React.FC = () => {
  return (
    <Result
      icon={<FileDoneOutlined style={{ color: '#1890ff' }} />}
      title="功能暂未实现"
      subTitle="敬请期待"
    />
  );
};

export default ContractList;


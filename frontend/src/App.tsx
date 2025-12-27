import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

import PrivateRoute from './components/PrivateRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import BomList from './pages/Bom/List';
import BomDetail from './pages/Bom/Detail';
import BomForm from './pages/Bom/Form';
import SupplierList from './pages/Supplier/List';
import SupplierForm from './pages/Supplier/Form';
import QuotationList from './pages/Quotation/List';
import QuotationDetail from './pages/Quotation/Detail';
import QuotationForm from './pages/Quotation/Form';
import ContractList from './pages/Contract/List';
import ContractTemplateList from './pages/ContractTemplate/List';
import Comparison from './pages/Comparison';
import Approval from './pages/Approval';

import './App.css';

dayjs.locale('zh-cn');

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/boms" replace />} />
            <Route path="boms" element={<BomList />} />
            <Route path="boms/new" element={<BomForm />} />
            <Route path="boms/:id/edit" element={<BomForm />} />
            <Route path="boms/:id" element={<BomDetail />} />
            <Route path="suppliers" element={<SupplierList />} />
            <Route path="suppliers/new" element={<SupplierForm />} />
            <Route path="suppliers/:id" element={<SupplierForm />} />
            <Route path="quotations" element={<QuotationList />} />
            <Route path="quotations/new" element={<QuotationForm />} />
            <Route path="quotations/:id/edit" element={<QuotationForm />} />
            <Route path="quotations/:id" element={<QuotationDetail />} />
            <Route path="approval" element={<Approval />} />
            <Route path="contracts" element={<ContractList />} />
            <Route path="contract-templates" element={<ContractTemplateList />} />
            <Route path="comparison" element={<Comparison />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;


import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

import PrivateRoute from './components/PrivateRoute';
import PermissionRoute from './components/PermissionRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import BomList from './pages/Bom/List';
import BomDetail from './pages/Bom/Detail';
import BomForm from './pages/Bom/Form';
import SupplierList from './pages/Supplier/List';
import SupplierForm from './pages/Supplier/Form';
import MaterialList from './pages/Material/List';
import MaterialFormPage from './pages/Material/FormPage';
import QuotationList from './pages/Quotation/List';
import QuotationDetail from './pages/Quotation/Detail';
import QuotationForm from './pages/Quotation/Form';
import ContractList from './pages/Contract/List';
import ContractTemplateList from './pages/ContractTemplate/List';
import Comparison from './pages/Comparison';
import Approval from './pages/Approval';
import UserList from './pages/User/List';

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
            <Route path="boms" element={<PermissionRoute permission="bom:view"><BomList /></PermissionRoute>} />
            <Route path="boms/new" element={<PermissionRoute permission="bom:create"><BomForm /></PermissionRoute>} />
            <Route path="boms/:id/edit" element={<PermissionRoute permission="bom:update"><BomForm /></PermissionRoute>} />
            <Route path="boms/:id" element={<PermissionRoute permission="bom:view"><BomDetail /></PermissionRoute>} />
            <Route path="suppliers" element={<PermissionRoute permission="supplier:view"><SupplierList /></PermissionRoute>} />
            <Route path="suppliers/new" element={<PermissionRoute permission="supplier:create"><SupplierForm /></PermissionRoute>} />
            <Route path="suppliers/:id" element={<PermissionRoute permission="supplier:view"><SupplierForm /></PermissionRoute>} />
            <Route path="materials" element={<PermissionRoute permission="material:view"><MaterialList /></PermissionRoute>} />
            <Route path="materials/new" element={<PermissionRoute permission="material:create"><MaterialFormPage /></PermissionRoute>} />
            <Route path="materials/:id" element={<PermissionRoute permission="material:view"><MaterialFormPage /></PermissionRoute>} />
            <Route path="quotations" element={<PermissionRoute permission="quotation:view"><QuotationList /></PermissionRoute>} />
            <Route path="quotations/new" element={<PermissionRoute permission="quotation:create"><QuotationForm /></PermissionRoute>} />
            <Route path="quotations/:id/edit" element={<PermissionRoute permission="quotation:update"><QuotationForm /></PermissionRoute>} />
            <Route path="quotations/:id" element={<PermissionRoute permission="quotation:view"><QuotationDetail /></PermissionRoute>} />
            <Route path="approval" element={<PermissionRoute permission="quotation:approve"><Approval /></PermissionRoute>} />
            <Route path="contracts" element={<PermissionRoute permission="contract:view"><ContractList /></PermissionRoute>} />
            <Route path="contract-templates" element={<PermissionRoute permission="contract:view"><ContractTemplateList /></PermissionRoute>} />
            <Route path="comparison" element={<PermissionRoute permission="quotation:view"><Comparison /></PermissionRoute>} />
            <Route path="users" element={<PermissionRoute permission="user:view"><UserList /></PermissionRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;


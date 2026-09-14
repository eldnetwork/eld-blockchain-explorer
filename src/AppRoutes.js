import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import TransactionPage from './pages/TransactionPage';
import AccountPage from './pages/AccountPage';
import BlockPage from './pages/BlockPage';
import ContentPage from './pages/ContentPage';
import ValidatorsPage from './pages/ValidatorsPage';
import ValidatorPage from './pages/ValidatorPage';
import CapacityProviderPage from './pages/CapacityProviderPage';
import CapacityProvidersPage from './pages/CapacityProvidersPage';
import PinboardPage from './pages/PinboardPage';
import PinboardPostPage from './pages/PinboardPostPage';
import SingleEpochPage from './pages/SingleEpochPage';
import NamespacePage from './pages/NamespacePage';
import HomePage from './pages/HomePage';

function LegacyCapacityProviderRedirect() {
  const { address } = useParams();
  return <Navigate to={`/capacity-provider/${address ?? ''}`} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/tx/:hash" element={<TransactionPage />} />
      <Route path="/transaction" element={<TransactionPage />} />
      <Route path="/account/:address" element={<AccountPage />} />
      <Route path="/block/:height/tx/:index" element={<TransactionPage />} />
      <Route path="/block/:height" element={<BlockPage />} />
      <Route path="/validators" element={<ValidatorsPage />} />
      <Route path="/capacity-providers" element={<CapacityProvidersPage />} />
      <Route path="/storage-providers" element={<Navigate to="/capacity-providers" replace />} />
      <Route path="/pinboard" element={<PinboardPage />} />
      <Route path="/pinboard/post/:wallet/:messageId" element={<PinboardPostPage />} />
      <Route path="/validator/:address" element={<ValidatorPage />} />
      <Route path="/capacity-provider/:address" element={<CapacityProviderPage />} />
      <Route path="/storage-validator/:address" element={<LegacyCapacityProviderRedirect />} />
      <Route path="/content/:contentId" element={<ContentPage />} />
      <Route path="/epoch/:epochId" element={<SingleEpochPage />} />
      <Route path="/namespaces/:namespaceSlug" element={<NamespacePage />} />
      <Route path="/" element={<HomePage />} />
    </Routes>
  );
}

export default AppRoutes;

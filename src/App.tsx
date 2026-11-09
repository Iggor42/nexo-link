import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { TenantLink } from './components/TenantLink';
import { NotFoundTenant } from './components/NotFoundTenant';
import { Home } from './components/Home';

/**
 * Redirect legado: /p/:slug → /:slug (URL canônica do padrão de links).
 * Mantém funcionando qualquer link antigo publicado com o prefixo /p/.
 */
function RedirectLegacyTenant() {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/${slug ?? ''}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/p/:slug" element={<RedirectLegacyTenant />} />
        <Route path="/:slug" element={<TenantLink />} />
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFoundTenant />} />
      </Routes>
    </BrowserRouter>
  );
}

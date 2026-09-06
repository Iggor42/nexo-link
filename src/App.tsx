import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PersonalLink } from './components/PersonalLink';
import { NotFoundPersonal } from './components/NotFoundPersonal';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/p/:slug" element={<PersonalLink />} />
        <Route path="/" element={<Navigate to="/p/lucaspersonal" replace />} />
        <Route path="*" element={<NotFoundPersonal />} />
      </Routes>
    </BrowserRouter>
  );
}

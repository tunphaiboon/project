import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import ProtectedRoute from './ProtectedRoute';

function Secret() { return <h1>หน้าลับ</h1>; }
function LoginPage() { return <h1>หน้า Login</h1>; }

function renderAt(path) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/me/wishlist" element={<ProtectedRoute><Secret /></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

beforeEach(() => localStorage.clear());

test('ยังไม่ login ต้องถูกพาไปหน้า Login', () => {
  renderAt('/me/wishlist');

  expect(screen.getByRole('heading', { name: 'หน้า Login' })).toBeInTheDocument();
  expect(screen.queryByText('หน้าลับ')).not.toBeInTheDocument();
});

test('มี token ใน localStorage แล้ว ต้องเห็นหน้าลับ', () => {
  // เซ็ตค่าลง localStorage ก่อนเรียก renderAt
  localStorage.setItem('shopmart.session', JSON.stringify({ token: 'mock.1.abc', user: { id: 1, displayName: 'Demo' } }));

  renderAt('/me/wishlist');

  expect(screen.getByRole('heading', { name: 'หน้าลับ' })).toBeInTheDocument();
});

test('session จาก boot เก่าต้องถูกล้างและพาไปหน้า Login', () => {
  localStorage.setItem('shopmart.session', JSON.stringify({ token: 'mock.1.abc' }));
  localStorage.setItem('shopmart.boot_id', 'old-boot');

  renderAt('/me/wishlist');

  expect(screen.getByRole('heading', { name: 'หน้า Login' })).toBeInTheDocument();
  expect(localStorage.getItem('shopmart.session')).toBeNull();
});

import { Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar';
import RequireAuth from './components/RequireAuth';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Auth from './pages/Auth';
import Checkout from './pages/Checkout';
import AdminDashboard from './pages/AdminDashboard';

function RequireAdmin({ children }) {
  let role = 'guest';
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      role = user.role;
    }
  } catch (e) {}

  if (role !== 'admin') {
    return (
      <div className="p-20 text-center">
        <h2 className="text-xl font-bold text-red-600">403 - สำหรับผู้ดูแลระบบ (Admin) เท่านั้น</h2>
        <p className="mt-2 text-slate-500">กรุณาเข้าสู่ระบบด้วยบัญชีแอดมินเพื่อจัดการระบบ</p>
      </div>
    );
  }
  return children;
}

export default function App() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <main>
        <Routes>
          {/* ส่วนของ Guest และ Member ทั่วไป (เข้าชมและค้นหาได้) */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />

          {/* ส่วนของ Member (ต้องเข้าสู่ระบบก่อน) */}
          <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
          <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />

          {/* ส่วนของ Admin (จัดการหลังบ้าน) */}
          <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />

          {/* หน้าสำรองกรณีไม่พบ URL */}
          <Route path="*" element={<p className="p-10 text-center">ไม่พบหน้านี้</p>} />
        </Routes>
      </main>
    </div>
  );
}
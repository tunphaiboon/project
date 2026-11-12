import { Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar';
import RequireAuth from './components/RequireAuth';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Auth from './pages/Auth';
import Checkout from './pages/Checkout';
import AdminProducts from './pages/AdminProducts';
import AdminUsers from './pages/AdminUsers';
import Profile from './pages/Profile'; // นำเข้า Profile

export default function App() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
          <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth><AdminProducts /></RequireAuth>} />
          <Route path="/admin/users" element={<RequireAuth><AdminUsers /></RequireAuth>} />
          
          {/* เพิ่ม Route สำหรับหน้าโปรไฟล์ โดยต้องล็อกอินก่อนเข้า (RequireAuth) */}
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          
          <Route path="*" element={<p className="p-10 text-center">ไม่พบหน้านี้</p>} />
        </Routes>
      </main>
    </div>
  );
}
import { Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar';
import RequireAuth from './components/RequireAuth';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Auth from './pages/Auth';
import Checkout from './pages/Checkout';

export default function App() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route path="*" element={<p className="p-10 text-center">ไม่พบหน้านี้</p>} />
          <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
        </Routes>
      </main>
    </div>
  );
}
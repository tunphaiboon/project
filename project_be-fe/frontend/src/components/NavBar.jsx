import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function NavBar() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  function onSearch(e) {
    e.preventDefault();
    navigate(`/products?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header className="bg-red-600 text-white shadow">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link to="/" className="text-xl font-bold">ShopMart</Link>
        <form onSubmit={onSearch} className="flex-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหาสินค้า"
            className="w-full rounded-md px-3 py-2 text-slate-900 outline-none"
          />
        </form>
        <Link to="/cart" className="hover:underline">ตะกร้า</Link>
        {session ? (
          <button onClick={logout} className="text-sm hover:underline">
            ออกจากระบบ ({session.user.displayName})
          </button>
        ) : (
          <Link to="/login" className="text-sm hover:underline">เข้าสู่ระบบ</Link>
        )}
      </div>
    </header>
  );
}
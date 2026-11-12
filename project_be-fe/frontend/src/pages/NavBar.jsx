import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function NavBar() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const currentUser = session?.member || session?.user;

  function onSearch(e) {
    e.preventDefault();
    navigate(`/products?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        {/* ชื่อร้าน */}
        <Link to="/" className="text-xl font-bold tracking-tight text-white hover:text-slate-200">
          Shopmart
        </Link>

        {/* ช่องค้นหา */}
        <form onSubmit={onSearch} className="flex flex-1 items-center">
          <div className="relative w-full max-w-xl">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหาสินค้า..."
              className="w-full rounded-md bg-slate-800 py-2 pl-4 pr-14 text-sm text-white placeholder-slate-400 border border-slate-700 focus:border-red-500 focus:outline-none"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 transition"
            >
              ค้นหา
            </button>
          </div>
        </form>

        {/* เมนูด้านขวา */}
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link to="/products" className="hidden hover:text-red-400 text-slate-300 sm:inline transition">
            สินค้าทั้งหมด
          </Link>

          {currentUser?.role === 'admin' && (
            <Link
              to="/admin"
              className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 transition"
            >
              จัดการระบบ (Admin)
            </Link>
          )}

          <Link
            to="/cart"
            className="flex items-center gap-1.5 rounded bg-slate-800 px-3 py-1.5 text-slate-300 hover:bg-slate-700 transition"
          >
            <span>🛒</span>
            <span>ตะกร้า</span>
          </Link>

          {session ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-slate-400 lg:inline">@{currentUser?.displayName || 'User'}</span>
              <button
                onClick={logout}
                className="rounded bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition"
              >
                ออกจากระบบ
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="rounded bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition"
            >
              เข้าสู่ระบบ
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
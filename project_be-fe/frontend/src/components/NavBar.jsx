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
    <header className="sticky top-0 z-30 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-lg border-b border-purple-500/30">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        {/* ชื่อร้าน Mercato */}
        <Link to="/" className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
            Mercato
          </span>
        </Link>

        {/* ช่องค้นหา */}
        <form onSubmit={onSearch} className="flex flex-1 items-center">
          <div className="relative w-full max-w-xl">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหาสินค้า แบรนด์ หรือหมวดหมู่..."
              className="w-full rounded-full bg-slate-800/95 py-2 pl-4 pr-14 text-sm text-white placeholder-slate-400 border border-purple-500/40 shadow-inner focus:border-amber-400 focus:outline-none"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-amber-400 px-4 py-1 text-xs font-bold text-slate-950 hover:bg-amber-300 transition shadow"
            >
              ค้นหา
            </button>
          </div>
        </form>

        {/* เมนูด้านขวา */}
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link to="/products" className="hidden hover:text-amber-300 text-slate-200 sm:inline transition">
            สินค้าทั้งหมด
          </Link>

          {currentUser?.role === 'admin' && (
            <Link
              to="/admin"
              className="rounded-full bg-amber-400 px-3.5 py-1 text-xs font-bold text-slate-950 hover:bg-amber-300 transition"
            >
              จัดการร้าน (Admin)
            </Link>
          )}

          <Link
            to="/cart"
            className="flex items-center gap-1.5 rounded-full bg-slate-800/80 border border-purple-500/30 px-3.5 py-1.5 hover:border-amber-400 text-slate-200 transition"
          >
            <span>🛒</span>
            <span>ตะกร้า</span>
          </Link>

          {session ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-purple-200 lg:inline">@{currentUser?.displayName || 'User'}</span>
              <button
                onClick={logout}
                className="rounded-full bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-purple-950 hover:text-white transition"
              >
                ออกจากระบบ
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-1.5 text-xs font-extrabold text-slate-950 hover:opacity-90 transition shadow"
            >
              เข้าสู่ระบบ
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
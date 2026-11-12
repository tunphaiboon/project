import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatBaht, getCart, setCartQty } from '../api/backend';
import { useAuth } from '../auth/AuthContext';

export default function ProductCard({ product }) {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  async function handleQuickAdd(e) {
    e.preventDefault(); // กันไม่ให้ลิงก์เปลี่ยนหน้าตอนกดปุ่มตะกร้า
    e.stopPropagation();
    if (!session) {
      navigate('/login');
      return;
    }
    if (product.stock === 0 || adding) return;

    setAdding(true);
    try {
      const cart = await getCart(session.token);
      const current = cart.items.find((i) => i.productId === product.id)?.qty ?? 0;
      if (current + 1 <= product.stock) {
        await setCartQty(session.token, product.id, current + 1);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
      } else {
        alert('ถึงจำนวนสูงสุดที่มีในสต็อกแล้ว');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  }

  return (
    <Link
      to={`/products/${product.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      {/* รูปสินค้า + ปุ่มใส่ตะกร้าด่วนมุมขวาบน */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-50 p-4">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />

        {/* Badge หมวดหมู่ */}
        {product.category && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-slate-900/75 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            {product.category}
          </span>
        )}

        {/* ปุ่มไอคอนตะกร้ากลมมุมขวาบน (ตามแบบภาพที่ 2) */}
        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={product.stock === 0 || adding}
          title={product.stock === 0 ? 'สินค้าหมด' : 'หยิบใส่ตะกร้าทันที'}
          className={`absolute right-2.5 top-2.5 flex h-10 w-10 items-center justify-center rounded-full shadow-md transition-all ${
            added
              ? 'bg-green-500 text-white scale-110'
              : product.stock === 0
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-amber-400 text-slate-900 hover:bg-red-600 hover:text-white active:scale-95'
          }`}
        >
          {added ? (
            <span className="text-sm font-bold">✓</span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          )}
        </button>

        {product.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-md bg-white px-3 py-1 text-xs font-bold text-slate-800">สินค้าหมด</span>
          </div>
        )}
      </div>

      {/* รายละเอียดสินค้า */}
      <div className="flex flex-1 flex-col justify-between p-3.5">
        <p className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-slate-800 group-hover:text-red-600">
          {product.name}
        </p>
        <div className="mt-3 flex items-baseline justify-between">
          <p className="text-base font-bold text-slate-900">
            {formatBaht(product.priceSatang)} <span className="text-xs font-normal text-slate-500">THB</span>
          </p>
          <span className="text-[11px] text-slate-400">คลัง {product.stock}</span>
        </div>
      </div>
    </Link>
  );
}
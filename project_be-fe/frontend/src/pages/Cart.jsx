import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatBaht, getCart, setCartQty } from '../api/backend';
import { useAuth } from '../auth/AuthContext';

export default function Cart() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(
    () => getCart(session.token).then(setCart).catch((e) => setError(e.message)),
    [session.token]
  );

  useEffect(() => { load(); }, [load]);

  async function change(productId, qty) {
    setError(null);
    try {
      await setCartQty(session.token, productId, qty);   // qty = 0 คือเอาออก
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  if (!cart) return <p className="p-10 text-center text-slate-400">กำลังโหลด...</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-semibold text-slate-800">ตะกร้าสินค้า</h1>
      {error && <p className="mt-3 text-red-600">{error}</p>}

      {cart.items.length === 0 ? (
        <p className="mt-6 text-slate-400">
          ยังไม่มีสินค้าในตะกร้า <Link to="/" className="text-red-600 underline">เลือกซื้อสินค้า</Link>
        </p>
      ) : (
        <>
          <ul className="mt-4 divide-y rounded-lg bg-white shadow-sm">
            {cart.items.map((item) => (
              <li key={item.productId} className="flex items-center gap-4 p-4">
                <img src={item.imageUrl} alt={item.name} className="h-16 w-16 rounded object-cover" />
                <div className="flex-1">
                  <p className="text-sm text-slate-800">{item.name}</p>
                  <p className="text-sm text-red-600">{formatBaht(item.priceSatang)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => change(item.productId, item.qty - 1)}
                          className="h-8 w-8 rounded border hover:bg-slate-100">-</button>
                  <span className="w-6 text-center">{item.qty}</span>
                  <button onClick={() => change(item.productId, item.qty + 1)}
                          disabled={item.qty >= item.stock}
                          className="h-8 w-8 rounded border hover:bg-slate-100 disabled:opacity-40">+</button>
                </div>
                <button onClick={() => change(item.productId, 0)}
                        className="text-sm text-slate-400 hover:text-red-600">ลบ</button>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
            <span className="text-slate-600">ยอดรวม</span>
            <span className="text-xl font-bold text-red-600">{formatBaht(cart.totalSatang)}</span>
          </div>

          <button onClick={() => navigate('/checkout')}
                  className="mt-4 w-full rounded-md bg-red-600 py-3 font-semibold text-white hover:bg-red-700">
            ไปหน้าชำระเงิน
          </button>
        </>
      )}
    </div>
  );
}
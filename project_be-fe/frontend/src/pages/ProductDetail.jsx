import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCart, formatBaht, getProduct, setCartQty } from '../api/backend';
import { useAuth } from '../auth/AuthContext';

export default function ProductDetail() {
  const { id } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let ignore = false;
    setProduct(null);
    setError(null);
    getProduct(id)
      .then((p) => { if (!ignore) setProduct(p); })
      .catch((e) => { if (!ignore) setError(e.message); });
    return () => { ignore = true; };
  }, [id]);

  async function addToCart() {
    if (!session) return navigate('/login');
    setBusy(true);
    setMsg('');
    try {
      const cart = await getCart(session.token);
      const current = cart.items.find((i) => i.productId === product.id)?.qty ?? 0;
      if (current + 1 > product.stock) {
        setMsg('ถึงจำนวนสูงสุดที่มีในสต็อกแล้ว');
      } else {
        await setCartQty(session.token, product.id, current + 1);
        setMsg('เพิ่มลงตะกร้าแล้ว');
      }
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <p className="p-10 text-center text-red-600">{error}</p>;
  if (!product) return <p className="p-10 text-center text-slate-400">กำลังโหลด...</p>;

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-2">
      <img src={product.imageUrl} alt={product.name} className="w-full rounded-lg bg-white object-cover" />
      <div>
        <p className="text-sm text-slate-500">{product.category}</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">{product.name}</h1>
        <p className="mt-4 text-3xl font-bold text-red-600">{formatBaht(product.priceSatang)}</p>
        <p className="mt-2 text-sm text-slate-500">คงเหลือ {product.stock} ชิ้น</p>
        <p className="mt-4 leading-relaxed text-slate-700">{product.description}</p>

        <button
          onClick={addToCart}
          disabled={busy || product.stock === 0}
          className="mt-6 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {product.stock === 0 ? 'สินค้าหมด' : busy ? 'กำลังเพิ่ม...' : 'หยิบใส่ตะกร้า'}
        </button>
        {msg && <p className="mt-3 text-sm text-slate-600">{msg}</p>}
      </div>
    </div>
  );
}
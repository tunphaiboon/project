import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listProducts } from '../api/backend';
import ProductCard from '../components/ProductCard';

export default function Products() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const category = params.get('category') || '';

  const [products, setProducts] = useState(null);
  const [error, setError] = useState(null);

  // โหลดใหม่ทุกครั้งที่คำค้นหรือหมวดเปลี่ยน
  useEffect(() => {
    let ignore = false;
    setProducts(null);
    setError(null);
    listProducts({ q, category })
      .then((res) => { if (!ignore) setProducts(res.items); })
      .catch((e) => { if (!ignore) setError(e.message); });
    return () => { ignore = true; };
  }, [q, category]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-xl font-semibold text-slate-800">
        {q ? `ผลการค้นหา "${q}"` : category ? 'สินค้าในหมวดที่เลือก' : 'สินค้าทั้งหมด'}
      </h1>
      {error && <p className="mt-4 text-red-600">{error}</p>}
      {!error && products === null && <p className="mt-4 text-slate-400">กำลังโหลด...</p>}
      {products && products.length === 0 && <p className="mt-6 text-slate-400">ไม่พบสินค้าที่ค้นหา</p>}
      {products && products.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
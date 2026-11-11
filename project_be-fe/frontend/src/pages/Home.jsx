import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listCategories, listProducts } from '../api/backend';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [cats, setCats] = useState([]);
  const [products, setProducts] = useState(null); // null = กำลังโหลด
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    Promise.all([listCategories(), listProducts()])
      .then(([c, p]) => {
        if (!ignore) {
          setCats(c.items);
          setProducts(p.items);
        }
      })
      .catch((e) => { if (!ignore) setError(e.message); });
    return () => { ignore = true; };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex h-48 items-center justify-center rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white md:h-64">
        <div className="text-center">
          <p className="text-3xl font-bold">ช้อปง่าย ส่งไว</p>
          <p className="mt-2">โปรโมชันพิเศษประจำสัปดาห์</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {cats.map((c) => (
          <Link
            key={c.slug}
            to={`/products?category=${c.slug}`}
            className="rounded-full border bg-white px-4 py-1 text-sm hover:border-red-500 hover:text-red-600"
          >
            {c.name}
          </Link>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold text-slate-800">สินค้าแนะนำ</h2>
      {error && <p className="mt-4 text-red-600">{error}</p>}
      {!error && products === null && <p className="mt-4 text-slate-400">กำลังโหลด...</p>}
      {products && (
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
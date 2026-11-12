import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listCategories, listProducts } from '../api/backend';
import ProductCard from '../components/ProductCard';

const PRICE_RANGES = [
  { id: 'all', label: 'ทุกราคา', min: 0, max: Infinity },
  { id: 'u50', label: 'ต่ำกว่า 50 ฿', min: 0, max: 5000 },
  { id: '50to200', label: '50 ฿ - 200 ฿', min: 5000, max: 20000 },
  { id: 'over200', label: 'มากกว่า 200 ฿', min: 20000, max: Infinity },
];

export default function Products() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const category = params.get('category') || '';

  const [cats, setCats] = useState([]);
  const [products, setProducts] = useState(null);
  const [error, setError] = useState(null);

  // ตัวกรองและเรียงลำดับฝั่ง Frontend
  const [priceRange, setPriceRange] = useState('all');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');
  const [openSec, setOpenSec] = useState({ cat: true, price: true, stock: true });

  useEffect(() => {
    listCategories()
      .then((res) => setCats(res.items))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let ignore = false;
    setProducts(null);
    setError(null);
    listProducts({ q, category })
      .then((res) => {
        if (!ignore) setProducts(res.items);
      })
      .catch((e) => {
        if (!ignore) setError(e.message);
      });
    return () => {
      ignore = true;
    };
  }, [q, category]);

  function selectCategory(slug) {
    const next = {};
    if (q) next.q = q;
    if (slug) next.category = slug;
    setParams(next);
  }

  // กรองและเรียงลำดับสินค้า
  const filteredProducts = useMemo(() => {
    if (!products) return null;
    const range = PRICE_RANGES.find((r) => r.id === priceRange) || PRICE_RANGES[0];

    let list = products.filter((p) => {
      if (p.priceSatang < range.min || p.priceSatang > range.max) return false;
      if (onlyInStock && p.stock <= 0) return false;
      return true;
    });

    if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => a.priceSatang - b.priceSatang);
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => b.priceSatang - a.priceSatang);
    } else if (sortBy === 'name-asc') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [products, priceRange, onlyInStock, sortBy]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
        {/* Sidebar ตัวกรองด้านซ้าย (ตามแบบภาพที่ 2) */}
        <aside className="space-y-2 md:col-span-1">
          {/* หมวดหมู่ */}
          <div className="border-b border-slate-200 pb-4">
            <button
              type="button"
              onClick={() => setOpenSec({ ...openSec, cat: !openSec.cat })}
              className="flex w-full items-center justify-between py-2 text-left font-semibold text-slate-800"
            >
              <span>หมวดหมู่สินค้า</span>
              <span className="text-xs text-slate-500">{openSec.cat ? '▲' : '▼'}</span>
            </button>
            {openSec.cat && (
              <ul className="mt-2 space-y-1.5 text-sm">
                <li>
                  <button
                    onClick={() => selectCategory('')}
                    className={`w-full rounded px-2 py-1 text-left ${
                      category === '' ? 'bg-red-50 font-semibold text-red-600' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    ทั้งหมด
                  </button>
                </li>
                {cats.map((c) => (
                  <li key={c.slug}>
                    <button
                      onClick={() => selectCategory(c.slug)}
                      className={`w-full rounded px-2 py-1 text-left ${
                        category === c.slug ? 'bg-red-50 font-semibold text-red-600' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ราคา */}
          <div className="border-b border-slate-200 pb-4">
            <button
              type="button"
              onClick={() => setOpenSec({ ...openSec, price: !openSec.price })}
              className="flex w-full items-center justify-between py-2 text-left font-semibold text-slate-800"
            >
              <span>ราคา</span>
              <span className="text-xs text-slate-500">{openSec.price ? '▲' : '▼'}</span>
            </button>
            {openSec.price && (
              <div className="mt-2 space-y-2 text-sm text-slate-700">
                {PRICE_RANGES.map((r) => (
                  <label key={r.id} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="priceRange"
                      checked={priceRange === r.id}
                      onChange={() => setPriceRange(r.id)}
                      className="accent-red-600"
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* สถานะสินค้า */}
          <div className="border-b border-slate-200 pb-4">
            <button
              type="button"
              onClick={() => setOpenSec({ ...openSec, stock: !openSec.stock })}
              className="flex w-full items-center justify-between py-2 text-left font-semibold text-slate-800"
            >
              <span>สถานะสต็อก</span>
              <span className="text-xs text-slate-500">{openSec.stock ? '▲' : '▼'}</span>
            </button>
            {openSec.stock && (
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="accent-red-600"
                />
                <span>แสดงเฉพาะสินค้าพร้อมส่ง</span>
              </label>
            )}
          </div>
        </aside>

        {/* พื้นที่แสดงรายการสินค้าด้านขวา */}
        <section className="md:col-span-3">
          {/* แถบหัวข้อ จำนวนสินค้า + Dropdown เรียงลำดับ (ตามแบบภาพที่ 2) */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
            <div>
              <span className="text-base font-medium text-slate-800">
                สินค้า {filteredProducts ? filteredProducts.length : 0} ชิ้น
              </span>
              {q && <span className="ml-2 text-sm text-slate-500">(คำค้นหา: "{q}")</span>}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">เรียงตาม:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-slate-800 focus:border-red-500 focus:outline-none"
              >
                <option value="recommended">แนะนำ</option>
                <option value="price-asc">ราคา: ต่ำ ไป สูง</option>
                <option value="price-desc">ราคา: สูง ไป ต่ำ</option>
                <option value="name-asc">ชื่อสินค้า A - Z</option>
              </select>
            </div>
          </div>

          {error && <p className="mt-4 text-red-600">{error}</p>}
          {!error && filteredProducts === null && (
            <p className="mt-8 text-center text-slate-400">กำลังโหลด...</p>
          )}
          {filteredProducts && filteredProducts.length === 0 && (
            <div className="rounded-xl bg-white p-12 text-center shadow-sm">
              <p className="text-slate-500">ไม่พบสินค้าที่ตรงกับตัวกรอง</p>
              <button
                onClick={() => {
                  setPriceRange('all');
                  setOnlyInStock(false);
                  selectCategory('');
                }}
                className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm text-white"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            </div>
          )}

          {filteredProducts && filteredProducts.length > 0 && (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listCategories, listProducts } from '../api/backend';
import ProductCard from '../components/ProductCard';

const BANNERS = [
  {
    title: 'คัดสรรสินค้าคุณภาพ',
    subtitle: 'ช้อปออนไลน์ส่งตรงถึงหน้าบ้าน โปรโมชันลดสูงสุดประจำสัปดาห์',
    badge: 'เริ่มต้น 99.-',
    bg: 'from-pink-500 via-rose-500 to-red-500',
    cta: '/products',
  },
  {
    title: 'อิเล็กทรอนิกส์ & แกดเจ็ต',
    subtitle: 'อัปเกรดอุปกรณ์ไอทีและของใช้ทันสมัยในราคาคุ้มค่า',
    badge: 'ส่งฟรีทั่วไทย',
    bg: 'from-indigo-600 via-purple-600 to-pink-500',
    cta: '/products?category=electronics',
  },
  {
    title: 'แฟชั่น & ความงามครบวงจร',
    subtitle: 'รวมไอเทมฮิตติดเทรนด์ ของแท้ 100% พร้อมส่งทุกชิ้น',
    badge: 'Hot Deal',
    bg: 'from-amber-500 via-orange-500 to-red-600',
    cta: '/products?category=beauty',
  },
];

export default function Home() {
  const [cats, setCats] = useState([]);
  const [products, setProducts] = useState(null);
  const [error, setError] = useState(null);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    let ignore = false;
    Promise.all([listCategories(), listProducts()])
      .then(([c, p]) => {
        if (!ignore) {
          setCats(c.items);
          setProducts(p.items);
        }
      })
      .catch((e) => {
        if (!ignore) setError(e.message);
      });
    return () => {
      ignore = true;
    };
  }, []);

  // เลื่อนแบนเนอร์อัตโนมัติทุก 4.5 วินาที
  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % BANNERS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const currentBanner = BANNERS[slide];

  return (
    <div className="pb-14">
      {/* Hero Banner Carousel (ตามแบบภาพที่ 1) */}
      <div className={`relative overflow-hidden bg-gradient-to-r ${currentBanner.bg} text-white transition-all duration-500`}>
        <div className="mx-auto flex min-h-[260px] max-w-6xl flex-col items-center justify-center px-12 py-10 text-center md:min-h-[340px]">
          <span className="rounded-full bg-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
            Special Promotion
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight drop-shadow md:text-5xl">
            {currentBanner.title}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/90 md:text-lg">
            {currentBanner.subtitle}
          </p>
          <div className="mt-6 flex items-center gap-4">
            <Link
              to={currentBanner.cta}
              className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-rose-600 shadow-lg transition hover:scale-105 hover:bg-slate-50"
            >
              ช้อปเลยตอนนี้
            </Link>
            <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 border-white/60 bg-rose-600/80 text-center shadow-lg">
              <span className="text-[10px] leading-none">เพียง</span>
              <span className="text-sm font-extrabold">{currentBanner.badge}</span>
            </div>
          </div>
        </div>

        {/* ปุ่มลูกศรซ้าย-ขวา */}
        <button
          onClick={() => setSlide((slide - 1 + BANNERS.length) % BANNERS.length)}
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/25 p-2 text-white hover:bg-black/40"
          aria-label="Previous slide"
        >
          ←
        </button>
        <button
          onClick={() => setSlide((slide + 1) % BANNERS.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/25 p-2 text-white hover:bg-black/40"
          aria-label="Next slide"
        >
          →
        </button>

        {/* จุดบอกตำแหน่งแบนเนอร์ (Dots) */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          {BANNERS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setSlide(idx)}
              className={`h-2.5 w-2.5 rounded-full border border-white transition-all ${
                idx === slide ? 'bg-white scale-125' : 'bg-transparent'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4">
        {/* แถบหมวดหมู่สินค้า */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <Link
            to="/products"
            className="rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-sm font-medium text-red-600 hover:bg-red-600 hover:text-white transition"
          >
            ดูสินค้าทั้งหมด
          </Link>
          {cats.map((c) => (
            <Link
              key={c.slug}
              to={`/products?category=${c.slug}`}
              className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-700 shadow-sm hover:border-red-500 hover:text-red-600 transition"
            >
              {c.name}
            </Link>
          ))}
        </div>

        {/* หัวข้อ Trendy Products (ตามแบบภาพที่ 1) */}
        <div className="mt-10 text-center">
          <h2 className="text-2xl font-bold tracking-wide text-slate-800">Trendy Products</h2>
          <div className="mt-1 flex items-center justify-center gap-2 text-slate-400">
            <span className="h-[1.5px] w-6 bg-slate-400" />
            <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-slate-500" />
            <span className="h-[1.5px] w-6 bg-slate-400" />
          </div>
        </div>

        {error && <p className="mt-6 text-center text-red-600">{error}</p>}
        {!error && products === null && (
          <p className="mt-8 text-center text-slate-400">กำลังโหลดรายการสินค้า...</p>
        )}

        {/* แถวสินค้าฮิต 5 คอลัมน์ */}
        {products && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {products.slice(0, 10).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                to="/products"
                className="inline-block rounded-full border border-slate-300 bg-white px-8 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-red-500 hover:text-red-600"
              >
                ดูสินค้าทั้งหมด ({products.length} ชิ้น) →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
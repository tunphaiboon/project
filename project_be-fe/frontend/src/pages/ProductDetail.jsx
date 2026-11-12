import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatBaht, getCart, getProduct, listProducts, setCartQty } from '../api/backend';
import { useAuth } from '../auth/AuthContext';
import ProductCard from '../components/ProductCard';

const VARIANTS = [
  { id: 'standard', label: 'รุ่นพื้นฐาน (มาตรฐาน)', extraSatang: 0 },
  { id: 'upgrade', label: 'รุ่นอัพเกรด (พรีเมียม)', extraSatang: 3900 },
  { id: 'set-a', label: 'เซ็ตสุดคุ้ม + อุปกรณ์เสริม', extraSatang: 6900 },
  { id: 'box', label: 'แพ็กเกจกล่องของขวัญ', extraSatang: 1900 },
];

export default function ProductDetail() {
  const { id } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [error, setError] = useState(null);

  const [activeImg, setActiveImg] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(VARIANTS[0]);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let ignore = false;
    setProduct(null);
    setError(null);
    setQty(1);
    setActiveImg(0);
    setSelectedVariant(VARIANTS[0]);
    setMsg('');

    getProduct(id)
      .then((p) => {
        if (!ignore) {
          setProduct(p);
          listProducts({ category: p.categorySlug })
            .then((res) => {
              if (!ignore) {
                setRelated(res.items.filter((item) => item.id !== p.id).slice(0, 5));
              }
            })
            .catch(() => {});
        }
      })
      .catch((e) => {
        if (!ignore) setError(e.message);
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  async function handleAdd(goToCheckout = false) {
    if (!session) return navigate('/login');
    if (!product || product.stock === 0) return;

    setBusy(true);
    setMsg('');
    try {
      const cart = await getCart(session.token);
      const current = cart.items.find((i) => i.productId === product.id)?.qty ?? 0;
      const nextQty = Math.min(current + qty, product.stock);

      if (current >= product.stock) {
        setMsg('สินค้าในตะกร้าถึงจำนวนสูงสุดที่มีในคลังแล้ว');
      } else {
        await setCartQty(session.token, product.id, nextQty);
        if (goToCheckout) {
          navigate('/checkout');
          return;
        }
        setMsg(`✓ เพิ่ม "${product.name}" (${selectedVariant.label}) จำนวน ${qty} ชิ้น ลงในรถเข็นแล้ว`);
      }
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <p className="p-10 text-center text-red-600">{error}</p>;
  if (!product) return <p className="p-10 text-center text-slate-400">กำลังโหลดข้อมูลสินค้า...</p>;

  const finalPriceSatang = product.priceSatang + selectedVariant.extraSatang;
  const originalPriceSatang = Math.round(finalPriceSatang * 1.45);
  const discountPercent = Math.round(((originalPriceSatang - finalPriceSatang) / originalPriceSatang) * 100);

  const gallery = [
    { url: product.imageUrl, badge: 'วัสดุเกรดพรีเมียม' },
    { url: product.imageUrl, badge: 'การันตีของแท้ 100%' },
    { url: product.imageUrl, badge: 'ขนาดมาตรฐาน' },
    { url: product.imageUrl, badge: 'สัมผัสนุ่ม ทนทาน' },
    { url: product.imageUrl, badge: 'แพ็กเกจกันกระแทก' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* 1. Breadcrumb เส้นทางหมวดหมู่ */}
      <nav className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:text-sm">
        <Link to="/" className="text-blue-600 hover:underline">Mercato</Link>
        <span>›</span>
        <Link to="/products" className="text-blue-600 hover:underline">สินค้าทั้งหมด</Link>
        <span>›</span>
        <Link to={`/products?category=${product.categorySlug}`} className="text-blue-600 hover:underline">
          {product.category}
        </Link>
        <span>›</span>
        <span className="line-clamp-1 font-medium text-slate-800">{product.name}</span>
      </nav>

      {/* 2. กล่องข้อมูลสินค้าหลัก */}
      <div className="grid grid-cols-1 gap-8 rounded-xl bg-white p-6 shadow-sm md:grid-cols-12">
        {/* ฝั่งซ้าย: รูปภาพ */}
        <div className="md:col-span-5">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
            <img
              src={gallery[activeImg].url}
              alt={product.name}
              className="h-full w-full object-contain p-4 transition-all duration-300"
            />
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-red-600/90 px-4 py-1 text-xs font-bold text-white shadow">
              {gallery[activeImg].badge}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-5 gap-2">
            {gallery.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImg(idx)}
                className={`relative aspect-square overflow-hidden rounded border-2 bg-slate-50 p-1 transition ${
                  activeImg === idx ? 'border-red-600 ring-1 ring-red-600' : 'border-slate-200 hover:border-red-400'
                }`}
              >
                <img src={img.url} alt="" className="h-full w-full object-contain" />
              </button>
            ))}
          </div>
        </div>

        {/* ฝั่งขวา: รายละเอียด ตัวเลือก และปุ่มซื้อ */}
        <div className="md:col-span-7">
          <div className="flex items-start gap-2">
            <span className="mt-1 shrink-0 rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
              ร้านแนะนำ
            </span>
            <h1 className="text-xl font-semibold leading-snug text-slate-900 sm:text-2xl">
              {product.name}
            </h1>
          </div>

          {/* กล่องราคาและส่วนลด */}
          <div className="mt-4 flex flex-wrap items-baseline gap-3 rounded-lg bg-slate-50 px-5 py-4">
            <span className="text-3xl font-extrabold text-red-600">
              {formatBaht(finalPriceSatang)}
            </span>
            <span className="text-sm text-slate-400 line-through">
              {formatBaht(originalPriceSatang)}
            </span>
            <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
              -{discountPercent}%
            </span>
          </div>

          {/* รายละเอียดการจัดส่งและการรับประกัน */}
          <div className="mt-5 space-y-4 text-sm">
            <div className="grid grid-cols-12 items-start gap-2">
              <span className="col-span-3 text-slate-500 sm:col-span-2">การจัดส่ง</span>
              <div className="col-span-9 space-y-1 sm:col-span-10">
                <p className="flex items-center gap-2 font-medium text-slate-800">
                  <span className="text-teal-600">🚚</span>
                  <span>จะได้รับภายใน 1-3 วันทำการ (จัดส่งด่วนทั่วไทย)</span>
                </p>
                <p className="font-semibold text-teal-600">ส่งฟรี เมื่อสั่งซื้อครบตามเงื่อนไข</p>
              </div>
            </div>

            <div className="grid grid-cols-12 items-center gap-2">
              <span className="col-span-3 text-slate-500 sm:col-span-2">การรับประกัน</span>
              <div className="col-span-9 flex flex-wrap items-center gap-2 text-slate-700 sm:col-span-10">
                <span className="text-red-600">🛡️</span>
                <span>ของแท้ 100% · เก็บเงินปลายทาง · คืนสินค้าได้ภายใน 7 วัน</span>
              </div>
            </div>

            <div className="grid grid-cols-12 items-start gap-2 pt-1">
              <span className="col-span-3 pt-2 text-slate-500 sm:col-span-2">ตัวเลือก</span>
              <div className="col-span-9 flex flex-wrap gap-2.5 sm:col-span-10">
                {VARIANTS.map((v) => {
                  const active = selectedVariant.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`flex items-center gap-2 rounded border px-3 py-2 text-xs font-medium transition sm:text-sm ${
                        active
                          ? 'border-red-600 bg-red-50/60 text-red-600'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-red-400'
                      }`}
                    >
                      <img src={product.imageUrl} alt="" className="h-5 w-5 rounded object-cover" />
                      <span>{v.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-12 items-center gap-2 pt-2">
              <span className="col-span-3 text-slate-500 sm:col-span-2">จำนวน</span>
              <div className="col-span-9 flex flex-wrap items-center gap-4 sm:col-span-10">
                <div className="inline-flex items-center rounded border border-slate-300">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    className="h-9 w-9 text-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={product.stock}
                    value={qty}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 1;
                      setQty(Math.min(Math.max(1, val), product.stock || 1));
                    }}
                    className="h-9 w-14 border-x border-slate-300 text-center text-sm font-medium outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                    disabled={qty >= product.stock}
                    className="h-9 w-9 text-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-slate-500">มีสินค้าทั้งหมด {product.stock} ชิ้น</span>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleAdd(false)}
              disabled={busy || product.stock === 0}
              className="flex items-center justify-center gap-2 rounded border-2 border-red-600 bg-red-50/70 px-6 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>🛒</span>
              <span>{busy ? 'กำลังเพิ่ม...' : 'เพิ่มไปยังรถเข็น'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleAdd(true)}
              disabled={busy || product.stock === 0}
              className="rounded bg-red-600 px-10 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {product.stock === 0 ? 'สินค้าหมด' : 'ซื้อสินค้า'}
            </button>
          </div>

          {msg && (
            <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700">
              {msg}
            </div>
          )}
        </div>
      </div>

      {/* 3. ข้อมูลจำเพาะและรายละเอียดสินค้า */}
      <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="rounded bg-slate-50 px-4 py-2.5 text-base font-bold text-slate-800">
          ข้อมูลจำเพาะของสินค้า
        </h2>
        <div className="mt-4 space-y-2.5 px-4 text-sm">
          <div className="grid grid-cols-12">
            <span className="col-span-4 text-slate-400 sm:col-span-2">หมวดหมู่</span>
            <span className="col-span-8 text-slate-800 sm:col-span-10">Mercato › {product.category}</span>
          </div>
          <div className="grid grid-cols-12">
            <span className="col-span-4 text-slate-400 sm:col-span-2">จำนวนสินค้า</span>
            <span className="col-span-8 text-slate-800 sm:col-span-10">{product.stock} ชิ้น</span>
          </div>
          <div className="grid grid-cols-12">
            <span className="col-span-4 text-slate-400 sm:col-span-2">ตัวเลือกที่เลือก</span>
            <span className="col-span-8 text-slate-800 sm:col-span-10">{selectedVariant.label}</span>
          </div>
          <div className="grid grid-cols-12">
            <span className="col-span-4 text-slate-400 sm:col-span-2">ส่งจาก</span>
            <span className="col-span-8 text-slate-800 sm:col-span-10">กรุงเทพมหานคร (คลังสินค้าหลัก)</span>
          </div>
        </div>

        <h2 className="mt-8 rounded bg-slate-50 px-4 py-2.5 text-base font-bold text-slate-800">
          รายละเอียดสินค้า
        </h2>
        <div className="mt-4 space-y-3 px-4 text-sm leading-relaxed text-slate-700">
          <p>{product.description || 'สินค้าคุณภาพคัดพิเศษ มาตรฐานการผลิตระดับสากล ทนทาน ใช้งานได้ยาวนาน'}</p>
          <ul className="list-disc space-y-1 pl-5 text-slate-600">
            <li>ผลิตจากวัสดุคุณภาพสูง ผ่านการตรวจสอบมาตรฐานทุกชิ้นก่อนจัดส่ง</li>
            <li>รองรับการใช้งานทั่วไปและงานระดับมืออาชีพ คุ้มค่าเกินราคา</li>
            <li>แพ็กสินค้าอย่างดีพร้อมกันกระแทก จัดส่งไวภายใน 1-3 วันทำการ</li>
            <li>มีบริการหลังการขาย สามารถติดต่อสอบถามแอดมินได้ตลอดเวลา</li>
          </ul>
        </div>
      </div>

      {/* 4. สินค้าที่คุณอาจจะสนใจ */}
      {related.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-slate-800">สินค้าที่คุณอาจจะสนใจ</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
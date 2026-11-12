import { useEffect, useState } from 'react';
import { createProduct, deleteProduct, listCategories, listProducts, updateProduct } from '../api/backend';
import { useAuth } from '../auth/AuthContext';

export default function AdminDashboard() {
  const { session } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    id: null,
    name: '',
    categorySlug: '',
    priceSatang: '',
    stock: '',
    imageUrl: '',
    description: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  function loadAdminData() {
    setLoading(true);
    Promise.all([listProducts(), listCategories()])
      .then(([prodRes, cats]) => {
        setProducts(prodRes.items || prodRes || []);
        // ป้องกัน Error โดยการเช็กว่า cats เป็น Array หรือไม่ ถ้าไม่ใช่ให้ดึง Object ด้านในหรือแปลงเป็น Array ว่าง
        const catList = Array.isArray(cats) ? cats : cats?.items || cats?.data || [];
        setCategories(catList);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  function handleInputChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    try {
      const token = session?.token || localStorage.getItem('token');
      const payload = {
        name: form.name,
        categorySlug: form.categorySlug,
        priceSatang: parseInt(form.priceSatang, 10) || 0,
        stock: parseInt(form.stock, 10) || 0,
        imageUrl: form.imageUrl || 'https://placehold.co/400x400?text=No+Image',
        description: form.description,
      };

      if (isEditing && form.id) {
        await updateProduct(token, form.id, payload);
        setMessage('✅ อัปเดตข้อมูลสินค้าสำเร็จ');
      } else {
        await createProduct(token, payload);
        setMessage('✅ เพิ่มสินค้าใหม่สำเร็จ');
      }

      setForm({ id: null, name: '', categorySlug: '', priceSatang: '', stock: '', imageUrl: '', description: '' });
      setIsEditing(false);
      loadAdminData();
    } catch (err) {
      setMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`);
    }
  }

  function startEdit(product) {
    setForm({
      id: product.id,
      name: product.name,
      categorySlug: product.categorySlug || product.category || '',
      priceSatang: product.priceSatang,
      stock: product.stock,
      imageUrl: product.imageUrl || '',
      description: product.description || '',
    });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id) {
    if (!window.confirm('⚠️ ยืนยันการลบสินค้านี้ออกจากระบบ?')) return;
    try {
      const token = session?.token || localStorage.getItem('token');
      await deleteProduct(token, id);
      setMessage('✅ ลบสินค้าสำเร็จ');
      loadAdminData();
    } catch (err) {
      setMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`);
    }
  }

  const inputClass = 'w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-red-600 focus:outline-none';

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 flex flex-col gap-2 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Admin Management Portal</h1>
            <p className="mt-1 text-sm text-slate-500">ระบบหลังบ้านสำหรับผู้ดูแลระบบ จัดการสต็อก เพิ่ม แก้ไข และลบสินค้า</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm">
              🛡️ Administrator Mode
            </span>
          </div>
        </div>

        {message && (
          <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 shadow-sm">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="sticky top-20 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">
                  {isEditing ? `✏️ แก้ไขสินค้า (ID: ${form.id})` : '📦 เพิ่มสินค้าใหม่'}
                </h2>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setForm({ id: null, name: '', categorySlug: '', priceSatang: '', stock: '', imageUrl: '', description: '' });
                    }}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    ยกเลิกการแก้ไข
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">ชื่อสินค้า</label>
                  <input name="name" value={form.name} onChange={handleInputChange} placeholder="กรอกชื่อสินค้า..." required className={inputClass} />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">หมวดหมู่</label>
                  <select name="categorySlug" value={form.categorySlug} onChange={handleInputChange} required className={inputClass}>
                    <option value="">-- เลือกหมวดหมู่สินค้า --</option>
                    {categories.map((c) => (
                      <option key={c.id || c.slug} value={c.slug}>{c.name} ({c.slug})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">ราคา (สตางค์ เช่น 15000 = 150 บาท)</label>
                  <input type="number" name="priceSatang" value={form.priceSatang} onChange={handleInputChange} placeholder="ระบุราคาเป็นสตางค์" required className={inputClass} />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">จำนวนสินค้าในคลัง (Stock)</label>
                  <input type="number" name="stock" value={form.stock} onChange={handleInputChange} placeholder="จำนวนชิ้น" required className={inputClass} />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">URL รูปภาพสินค้า</label>
                  <input name="imageUrl" value={form.imageUrl} onChange={handleInputChange} placeholder="https://..." className={inputClass} />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">รายละเอียดสินค้า</label>
                  <textarea name="description" value={form.description} onChange={handleInputChange} rows="3" placeholder="ระบุรายละเอียด..." className={inputClass} />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white shadow hover:bg-red-700 transition"
                >
                  {isEditing ? 'บันทึกการแก้ไขสินค้า' : 'เพิ่มสินค้าลงระบบ'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">รายการสินค้าทั้งหมด ({products.length})</h2>
              </div>

              {loading ? (
                <p className="py-12 text-center text-sm text-slate-500">กำลังโหลดข้อมูลสินค้า...</p>
              ) : error ? (
                <p className="py-12 text-center text-sm text-red-600">{error}</p>
              ) : products.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-500">ยังไม่มีรายการสินค้าในระบบ</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-100 text-xs uppercase font-bold text-slate-600">
                      <tr>
                        <th className="p-3">รูปภาพ</th>
                        <th className="p-3">ชื่อสินค้า</th>
                        <th className="p-3">หมวดหมู่</th>
                        <th className="p-3">ราคา (สตางค์)</th>
                        <th className="p-3">สต็อก</th>
                        <th className="p-3 text-right">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition">
                          <td className="p-3">
                            <img src={p.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover border border-slate-200 bg-slate-100" />
                          </td>
                          <td className="p-3 font-bold text-slate-900">{p.name}</td>
                          <td className="p-3 text-slate-600">{p.category || p.categorySlug}</td>
                          <td className="p-3 font-semibold text-slate-700">{p.priceSatang}</td>
                          <td className="p-3 text-slate-600">{p.stock}</td>
                          <td className="p-3 text-right space-x-1.5">
                            <button
                              type="button"
                              onClick={() => startEdit(p)}
                              className="rounded bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition shadow-sm"
                            >
                              แก้ไข
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(p.id)}
                              className="rounded bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition shadow-sm"
                            >
                              ลบ
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
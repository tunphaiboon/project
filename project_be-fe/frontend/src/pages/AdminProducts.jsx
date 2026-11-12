import { useEffect, useState } from 'react';
import { createProduct, deleteProduct, listCategories, listProducts, updateProduct } from '../api/backend';
import { useAuth } from '../auth/AuthContext';
import { Link } from 'react-router-dom';

export default function AdminProducts() {
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

  function loadData() {
    setLoading(true);
    Promise.all([listProducts(), listCategories()])
      .then(([prodRes, cats]) => {
        setProducts(prodRes.items || prodRes || []);
        const catList = Array.isArray(cats) ? cats : cats?.items || cats?.data || [];
        setCategories(catList);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

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
      loadData();
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
  }

  async function handleDelete(id) {
    if (!window.confirm('⚠️ ยืนยันการลบสินค้านี้?')) return;
    try {
      const token = session?.token || localStorage.getItem('token');
      await deleteProduct(token, id);
      setMessage('✅ ลบสินค้าสำเร็จ');
      loadData();
    } catch (err) {
      setMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`);
    }
  }

  const inputClass = 'w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-red-600 focus:outline-none';

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6 flex items-center justify-between border-b pb-4">
          <h1 className="text-2xl font-extrabold text-slate-900">📦 จัดการสต็อกสินค้า</h1>
          <div className="space-x-2">
            <Link to="/admin/users" className="rounded bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700">
              ไปหน้าจัดการผู้ใช้งาน ➔
            </Link>
          </div>
        </div>

        {message && <div className="mb-4 rounded bg-white p-3 text-sm shadow-sm">{message}</div>}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-bold mb-4">{isEditing ? '✏️ แก้ไขสินค้า' : '➕ เพิ่มสินค้าใหม่'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input name="name" value={form.name} onChange={handleInputChange} placeholder="ชื่อสินค้า" required className={inputClass} />
              <select name="categorySlug" value={form.categorySlug} onChange={handleInputChange} required className={inputClass}>
                <option value="">-- เลือกหมวดหมู่ --</option>
                {categories.map((c) => (<option key={c.id || c.slug} value={c.slug}>{c.name}</option>))}
              </select>
              <input type="number" name="priceSatang" value={form.priceSatang} onChange={handleInputChange} placeholder="ราคา (สตางค์)" required className={inputClass} />
              <input type="number" name="stock" value={form.stock} onChange={handleInputChange} placeholder="สต็อก" required className={inputClass} />
              <input name="imageUrl" value={form.imageUrl} onChange={handleInputChange} placeholder="URL รูปภาพ" className={inputClass} />
              <textarea name="description" value={form.description} onChange={handleInputChange} placeholder="รายละเอียด" rows="2" className={inputClass} />
              <button type="submit" className="w-full bg-red-600 text-white py-2 rounded font-bold hover:bg-red-700">
                {isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-bold mb-4">รายการสินค้าทั้งหมด ({products.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase font-bold text-slate-600">
                  <tr>
                    <th className="p-2">รูป</th>
                    <th className="p-2">ชื่อ</th>
                    <th className="p-2">ราคา</th>
                    <th className="p-2">สต็อก</th>
                    <th className="p-2 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="p-2"><img src={p.imageUrl} className="h-10 w-10 rounded object-cover" alt="" /></td>
                      <td className="p-2 font-bold">{p.name}</td>
                      <td className="p-2">{p.priceSatang}</td>
                      <td className="p-2">{p.stock}</td>
                      <td className="p-2 text-right space-x-1">
                        <button onClick={() => startEdit(p)} className="bg-amber-500 text-white px-2 py-1 rounded text-xs font-bold">แก้ไข</button>
                        <button onClick={() => handleDelete(p.id)} className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">ลบ</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
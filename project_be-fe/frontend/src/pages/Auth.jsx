import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, register } from '../api/backend';
import { useAuth } from '../auth/AuthContext';

export default function Auth({ mode }) {
  const { saveSession } = useAuth();
  const navigate = useNavigate();
  const isRegister = mode === 'register';

  const [form, setForm] = useState({ email: '', password: '', displayName: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (name) => (e) => setForm({ ...form, [name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const data = isRegister
        ? await register(form)
        : await login({ email: form.email, password: form.password });
      saveSession({ token: data.token, user: data.user });
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const input = 'w-full rounded-md border border-slate-300 px-3 py-2 focus:border-red-500 focus:outline-none';

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-xl font-semibold text-slate-800">{isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}</h1>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-lg bg-white p-6 shadow-sm">
        {isRegister && (
          <input className={input} placeholder="ชื่อที่แสดง" value={form.displayName} onChange={set('displayName')} />
        )}
        <input className={input} type="email" placeholder="อีเมล" value={form.email} onChange={set('email')} required />
        <input className={input} type="password" placeholder="รหัสผ่าน (อย่างน้อย 8 ตัว)" value={form.password} onChange={set('password')} required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-red-600 py-2 font-semibold text-white hover:bg-red-700 disabled:bg-slate-300"
        >
          {busy ? 'กำลังดำเนินการ...' : isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        {isRegister ? <>มีบัญชีแล้ว? <Link to="/login" className="text-red-600 underline">เข้าสู่ระบบ</Link></>
                    : <>ยังไม่มีบัญชี? <Link to="/register" className="text-red-600 underline">สมัครสมาชิก</Link></>}
      </p>
    </div>
  );
}
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, register } from '../api/backend';
import { useAuth } from '../auth/AuthContext';

export default function Auth({ mode }) {
  const { saveSession } = useAuth();
  const navigate = useNavigate();
  const isRegister = mode === 'register';

  const [form, setForm] = useState({ email: '', password: '', displayName: '' });
  const [showPassword, setShowPassword] = useState(false);
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
      
      const memberData = data.member || data.user;
      saveSession({ token: data.token, member: memberData });

      if (memberData?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const EyeIcon = ({ show }) => show ? (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const input = 'w-full rounded-md border border-slate-300 px-3 py-2 focus:border-red-500 focus:outline-none';

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-xl font-semibold text-slate-800">{isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}</h1>
      
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-lg bg-white p-6 shadow-sm">
        {isRegister && (
          <input className={input} placeholder="ชื่อที่แสดง" value={form.displayName} onChange={set('displayName')} />
        )}
        <input className={input} type="email" placeholder="อีเมล" value={form.email} onChange={set('email')} required />
        
        <div className="relative">
          <input
            className={`${input} pr-10 [&::-ms-reveal]:hidden`}
            type={showPassword ? 'text' : 'password'}
            placeholder="รหัสผ่าน (อย่างน้อย 8 ตัว)"
            value={form.password}
            onChange={set('password')}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700"
          >
            <EyeIcon show={showPassword} />
          </button>
        </div>

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

      {!isRegister && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              localStorage.removeItem('shopmart.session');
              navigate('/');
            }}
            className="w-full rounded-md border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            Guest
          </button>
        </div>
      )}
    </div>
  );
}
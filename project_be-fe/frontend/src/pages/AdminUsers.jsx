import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Link } from 'react-router-dom';

const API_BASE = 'http://localhost:8080';

export default function AdminUsers() {
  const { session } = useAuth();
  const [users, setUsers] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [message, setMessage] = useState('');

  function loadUsers() {
    const token = session?.token || session?.access_token || localStorage.getItem('token');
    
    fetch(`${API_BASE}/api/admin/users`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      }
    })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Server Error (${res.status}): ${text}`);
        }
        return res.json();
      })
      .then(data => {
        setUsers(Array.isArray(data) ? data : data.items || []);
      })
      .catch(err => {
        setErrorMsg(err.message);
      });
  }

  useEffect(() => { loadUsers(); }, [session]);

  async function handleRoleChange(userId, newRole) {
    try {
      const token = session?.token || session?.access_token || localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (!res.ok) throw new Error("อัปเดตสิทธิ์ไม่สำเร็จ");
      setMessage('✅ อัปเดตสิทธิ์ Role สำเร็จ');
      loadUsers();
    } catch (err) {
      setMessage(`❌ เกิดข้อผิดพลาด: ${err.message}`);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-6 flex items-center justify-between border-b pb-4">
          <h1 className="text-2xl font-extrabold text-slate-900">👥 จัดการผู้ใช้งานระบบ</h1>
          <Link to="/admin" className="rounded bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700">
            ➔ กลับไปหน้าจัดการสินค้า
          </Link>
        </div>

        {errorMsg && <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700 shadow-sm">⚠️ {errorMsg}</div>}
        {message && <div className="mb-4 rounded bg-green-100 p-3 text-sm text-green-700 shadow-sm">{message}</div>}

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold mb-4">รายชื่อผู้ใช้ทั้งหมด ({users.length})</h2>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase font-bold text-slate-600">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">ชื่อ</th>
                <th className="p-3">อีเมล</th>
                <th className="p-3">Role ปัจจุบัน</th>
                <th className="p-3 text-right">เปลี่ยนสิทธิ์</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="p-3 text-slate-500">{u.id}</td>
                  <td className="p-3 font-bold">{u.name || '-'}</td>
                  <td className="p-3 text-slate-600">{u.email}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="rounded border px-2 py-1 text-xs font-semibold bg-white"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
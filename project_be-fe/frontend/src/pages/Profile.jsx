import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext"; 

const API_BASE = process.env.REACT_APP_API_URL || 'https://project-be-fe.onrender.com';

export default function Profile() {
  const { session } = useAuth();
  const token = session?.token || session?.access_token || localStorage.getItem("token");

  const [profile, setProfile] = useState({ name: "", phone: "", address: "" });
  const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "" });

  useEffect(() => {
    if (!token) return; 

    fetch(`${API_BASE}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.id) {
          setProfile({ 
            name: data.name || "", 
            phone: data.phone || "", 
            address: data.address || "" 
          });
        }
      })
      .catch(err => console.error("Error fetching profile:", err));
  }, [token]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/api/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(profile)
    });
    
    if (res.ok) {
      alert("อัปเดตข้อมูลสำเร็จ!");
    } else {
      alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/api/profile/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(passwords)
    });
    
    const data = await res.json().catch(() => ({}));
    
    if (res.ok) {
      alert("เปลี่ยนรหัสผ่านสำเร็จ!");
      setPasswords({ oldPassword: "", newPassword: "" }); 
    } else {
      alert("ระบบแจ้งว่า: " + (data.error || "เปลี่ยนรหัสผ่านไม่สำเร็จ (รหัสเดิมอาจผิด)"));
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">จัดการโปรไฟล์</h2>
      
      <form onSubmit={handleUpdateProfile} className="mb-8 p-6 bg-white rounded shadow text-slate-800">
        <h3 className="text-lg font-bold mb-4">ข้อมูลส่วนตัว</h3>
        <div className="mb-4">
          <label className="block mb-1 font-medium">ชื่อ-นามสกุล</label>
          <input type="text" className="w-full border p-2 rounded bg-slate-50" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">เบอร์โทรศัพท์</label>
          <input type="text" className="w-full border p-2 rounded bg-slate-50" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">ที่อยู่จัดส่ง</label>
          <textarea className="w-full border p-2 rounded bg-slate-50" rows="3" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })}></textarea>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-bold">บันทึกข้อมูล</button>
      </form>

      <form onSubmit={handleChangePassword} className="p-6 bg-white rounded shadow text-slate-800">
        <h3 className="text-lg font-bold mb-4">เปลี่ยนรหัสผ่าน</h3>
        <div className="mb-4">
          <label className="block mb-1 font-medium">รหัสผ่านเดิม</label>
          <input type="password" className="w-full border p-2 rounded bg-slate-50" required value={passwords.oldPassword} onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })} />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">รหัสผ่านใหม่</label>
          <input type="password" className="w-full border p-2 rounded bg-slate-50" required value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
        </div>
        <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-bold">เปลี่ยนรหัสผ่าน</button>
      </form>
    </div>
  );
}
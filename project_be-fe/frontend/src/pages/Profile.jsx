import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext"; 

const API_BASE = process.env.REACT_APP_API_URL || 'https://project-be-fe.onrender.com';

export default function Profile() {
  const { session } = useAuth();
  const token = session?.token || session?.access_token || localStorage.getItem("token");

  const [profile, setProfile] = useState({ name: "", phone: "", address: "" });
  const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "" });
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

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
          <div className="relative">
            <input 
              type={showOldPass ? "text" : "password"} 
              className="w-full border p-2 pr-10 rounded bg-slate-50 [&::-ms-reveal]:hidden" 
              required 
              value={passwords.oldPassword} 
              onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })} 
            />
            <button 
              type="button" 
              onClick={() => setShowOldPass(!showOldPass)} 
              className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 hover:text-slate-700"
            >
              <EyeIcon show={showOldPass} />
            </button>
          </div>
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">รหัสผ่านใหม่</label>
          <div className="relative">
            <input 
              type={showNewPass ? "text" : "password"} 
              className="w-full border p-2 pr-10 rounded bg-slate-50 [&::-ms-reveal]:hidden" 
              required 
              value={passwords.newPassword} 
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} 
            />
            <button 
              type="button" 
              onClick={() => setShowNewPass(!showNewPass)} 
              className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 hover:text-slate-700"
            >
              <EyeIcon show={showNewPass} />
            </button>
          </div>
        </div>
        <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-bold">เปลี่ยนรหัสผ่าน</button>
      </form>
    </div>
  );
}
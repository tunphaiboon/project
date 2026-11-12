import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);
const KEY = 'shopmart.session';
const BOOT_KEY = 'shopmart.boot_id';

const CURRENT_BOOT_ID = (() => {
  try {
    // ใช้ Function เพื่อซ่อน syntax import.meta จาก Jest parser พื้นฐาน
    const metaEnv = new Function('return (typeof import.meta !== "undefined" && import.meta.env) ? import.meta.env.VITE_BOOT_ID : undefined')();
    return metaEnv || process.env.REACT_APP_BOOT_ID || 'default';
  } catch (e) {
    return process.env.REACT_APP_BOOT_ID || 'default';
  }
})();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const savedBootId = localStorage.getItem(BOOT_KEY);

    if (savedBootId && savedBootId !== String(CURRENT_BOOT_ID)) {
      localStorage.removeItem(KEY);
      localStorage.setItem(BOOT_KEY, String(CURRENT_BOOT_ID));
      return null;
    }

    if (!savedBootId) {
      localStorage.setItem(BOOT_KEY, String(CURRENT_BOOT_ID));
    }

    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  });

  function saveSession(next) {
    setSession(next);
    if (next) {
      localStorage.setItem(KEY, JSON.stringify(next));
      localStorage.setItem(BOOT_KEY, String(CURRENT_BOOT_ID));
    } else {
      localStorage.removeItem(KEY);
    }
  }

  return (
    <AuthContext.Provider value={{ session, saveSession, logout: () => saveSession(null) }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
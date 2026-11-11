import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);
const KEY = 'shopmart.session';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;   // session = { token, user }
  });

  function saveSession(next) {
    setSession(next);
    if (next) localStorage.setItem(KEY, JSON.stringify(next));
    else localStorage.removeItem(KEY);
  }

  return (
    <AuthContext.Provider value={{ session, saveSession, logout: () => saveSession(null) }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
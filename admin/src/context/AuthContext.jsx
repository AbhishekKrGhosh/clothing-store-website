import { createContext, useContext, useEffect, useState } from 'react';
import { get, post } from '../lib/api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('aaro_admin_token')) return setReady(true);
    get('/auth/me')
      .then((u) => (u.role === 'admin' ? setUser(u) : localStorage.removeItem('aaro_admin_token')))
      .catch(() => localStorage.removeItem('aaro_admin_token'))
      .finally(() => setReady(true));
  }, []);

  const login = async (email, password) => {
    const res = await post('/auth/login', { email, password });
    if (res.user.role !== 'admin') throw new Error('This account does not have admin access');
    localStorage.setItem('aaro_admin_token', res.token);
    setUser(res.user);
  };
  const logout = () => {
    localStorage.removeItem('aaro_admin_token');
    setUser(null);
  };
  return <Ctx.Provider value={{ user, setUser, ready, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { get, post } from '../lib/api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('aaro_token')) return setReady(true);
    get('/auth/me')
      .then(setUser)
      .catch(() => localStorage.removeItem('aaro_token'))
      .finally(() => setReady(true));
  }, []);

  const handle = (res) => {
    localStorage.setItem('aaro_token', res.token);
    setUser(res.user);
    return res.user;
  };

  const login = useCallback((email, password) => post('/auth/login', { email, password }).then(handle), []);
  const register = useCallback((data) => post('/auth/register', data).then(handle), []);
  const logout = useCallback(() => {
    localStorage.removeItem('aaro_token');
    setUser(null);
  }, []);

  return <AuthCtx.Provider value={{ user, setUser, ready, login, register, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);

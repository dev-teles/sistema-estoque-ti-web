import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api, setOnUnauthorized } from '../services/api';
import type { Usuario } from '../types/estoque';

interface AuthContextData {
  user: Usuario | null;
  loading: boolean;
  login: (email: string, password: string, website?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Limpa eventual token legado que tenha ficado no localStorage
    localStorage.removeItem('estoque_ti_token');

    setOnUnauthorized(() => setUser(null));

    // Validação estritamente server-side via cookie HttpOnly (estoque_ti_jwt)
    api
      .get<{ data: Usuario }>('/auth/me')
      .then((res) => setUser(res.data.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    return () => setOnUnauthorized(null);
  }, []);

  const login = async (email: string, password: string, website?: string) => {
    const res = await api.post<{ user: Usuario }>('/auth/login', {
      email,
      password,
      website: website || undefined,
    });
    setUser(res.data.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextData {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser utilizado dentro de AuthProvider');
  return ctx;
}

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, setUnauthorizedHandler } from "./api";

export interface Me {
  id: string;
  email: string;
  name: string;
  role: string;
  twoFactorEnabled: boolean;
  permissions: string[];
}

interface AuthCtx {
  user: Me | null;
  loading: boolean;
  can: (perm: string) => boolean;
  setUser: (u: Me | null) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>(null as never);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setUser(await api.get<Me>("/auth/me"));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    void refresh();
  }, [refresh]);

  const logout = async () => {
    await api.post("/auth/logout").catch(() => undefined);
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, setUser, refresh, logout, can: (p) => Boolean(user?.permissions.includes(p)) }}>{children}</Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

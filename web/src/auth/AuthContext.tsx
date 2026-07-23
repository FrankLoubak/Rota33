/**
 * Finalidade: contexto de autenticação da web (cadastro, login, social, sessão).
 * Como funciona: no mount tenta refresh silencioso (cookie httpOnly); expõe login,
 *   register, socialLogin e logout; guarda o usuário autenticado para a UI.
 * Relações: usa api/client; consumido por App, ProtectedRoute e páginas.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, setAccessToken } from "../api/client";
import type { Usuario } from "../api/types";

type Status = "loading" | "authed" | "anon";

interface AuthValue {
  status: Status;
  usuario: Usuario | null;
  login: (email: string, senha: string) => Promise<void>;
  register: (nome: string, email: string, senha: string) => Promise<void>;
  socialLogin: (provedor: "google" | "apple", idToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

interface SessaoResp {
  usuario: Usuario;
  accessToken: string;
}

const AuthCtx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  function entrar(r: SessaoResp) {
    setAccessToken(r.accessToken);
    setUsuario(r.usuario);
    setStatus("authed");
  }

  useEffect(() => {
    (async () => {
      try {
        const { accessToken } = await api.post<{ accessToken: string }>("/auth/refresh");
        setAccessToken(accessToken);
        // Sessão restaurada; o backend não devolve o perfil no refresh — marca autenticado.
        setStatus("authed");
      } catch {
        setStatus("anon");
      }
    })();
  }, []);

  const value: AuthValue = {
    status,
    usuario,
    async login(email, senha) {
      entrar(await api.post<SessaoResp>("/auth/login", { email, senha }));
    },
    async register(nome, email, senha) {
      entrar(await api.post<SessaoResp>("/auth/register", { nome, email, senha }));
    },
    async socialLogin(provedor, idToken) {
      entrar(await api.post<SessaoResp>("/auth/social", { provedor, idToken }));
    },
    async logout() {
      try {
        await api.post("/auth/logout");
      } finally {
        setAccessToken(null);
        setUsuario(null);
        setStatus("anon");
      }
    },
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth fora de AuthProvider");
  return ctx;
}

import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { RotasPage } from "./pages/RotasPage";
import { RotaDetalhePage } from "./pages/RotaDetalhePage";
import { t } from "./i18n";
import "./styles.css";

function Topbar() {
  const { status, usuario, logout } = useAuth();
  const nav = useNavigate();

  if (status !== "authed") return null;

  return (
    <nav className="topbar">
      <h1>{t("app.nome")}</h1>
      <span className="spacer" />
      {usuario && <span title={usuario.email}>{usuario.nome}</span>}
      <button
        className="small"
        title={t("acao.sair")}
        onClick={async () => { await logout(); nav("/login"); }}
        style={{ background: "transparent", color: "#e2e8f0", border: "1px solid #475569" }}
      >
        {t("acao.sair")}
      </button>
    </nav>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  if (status === "loading") return <div className="content"><p>{t("estado.carregando")}</p></div>;
  if (status === "anon") return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Topbar />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/rotas" element={<ProtectedRoute><RotasPage /></ProtectedRoute>} />
          <Route path="/rotas/:id" element={<ProtectedRoute><RotaDetalhePage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/rotas" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

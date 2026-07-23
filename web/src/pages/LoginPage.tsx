import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Field, Button, Banner, useAsync } from "../components/ui";
import { t } from "../i18n";

export function LoginPage() {
  const [modo, setModo] = useState<"login" | "cadastro">("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const { login, register } = useAuth();
  const { loading, error, run } = useAsync();
  const nav = useNavigate();

  function submeter(e: React.FormEvent) {
    e.preventDefault();
    run(async () => {
      if (modo === "login") {
        await login(email, senha);
      } else {
        await register(nome, email, senha);
      }
      nav("/rotas");
    });
  }

  return (
    <div className="login-wrap">
      <div className="card login-card">
        <h2 style={{ marginTop: 0 }}>
          {modo === "login" ? t("login.titulo") : t("login.cadastro.titulo")}
        </h2>

        <Banner kind="error">{error}</Banner>

        <form onSubmit={submeter} noValidate>
          {modo === "cadastro" && (
            <Field
              label={t("login.nome")}
              title={t("login.nome.dica")}
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              autoComplete="name"
            />
          )}
          <Field
            label={t("login.email")}
            title={t("login.email.dica")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Field
            label={t("login.senha")}
            title={t("login.senha.dica")}
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            autoComplete={modo === "login" ? "current-password" : "new-password"}
          />

          <Button
            title={modo === "login" ? t("login.entrar.dica") : t("login.cadastrar.dica")}
            type="submit"
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading
              ? t("estado.carregando")
              : modo === "login"
                ? t("acao.entrar")
                : t("acao.cadastrar")}
          </Button>
        </form>

        <div className="divisor">ou</div>

        <Button
          title={t("login.social.google.dica")}
          variant="secondary"
          style={{ width: "100%" }}
          disabled
        >
          {t("login.social.google")}
        </Button>

        <p style={{ textAlign: "center", marginBottom: 0 }}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setModo(modo === "login" ? "cadastro" : "login");
            }}
          >
            {modo === "login"
              ? t("login.alternar.paraCadastro")
              : t("login.alternar.paraLogin")}
          </a>
        </p>
      </div>
    </div>
  );
}

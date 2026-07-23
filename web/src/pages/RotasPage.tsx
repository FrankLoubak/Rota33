import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Rota } from "../api/types";
import { Button, Banner, useAsync } from "../components/ui";
import { t } from "../i18n";

function statusLabel(s: Rota["status"]): string {
  const map: Record<Rota["status"], string> = {
    planejamento: t("rotas.status.planejamento"),
    em_andamento: t("rotas.status.em_andamento"),
    concluida: t("rotas.status.concluida"),
    cancelada: t("rotas.status.cancelada"),
  };
  return map[s];
}

export function RotasPage() {
  const [rotas, setRotas] = useState<Rota[]>([]);
  const { loading, error, run } = useAsync();
  const nav = useNavigate();

  async function carregar() {
    const lista = await api.get<Rota[]>("/rotas");
    setRotas(lista);
  }

  useEffect(() => {
    run(carregar);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function novaRota() {
    run(async () => {
      const r = await api.post<Rota>("/rotas");
      nav(`/rotas/${r.id}`);
    });
  }

  async function excluirRota(id: string) {
    run(async () => {
      await api.del(`/rotas/${id}`);
      setRotas((prev) => prev.filter((r) => r.id !== id));
    });
  }

  return (
    <div className="content">
      <div className="row" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>{t("rotas.titulo")}</h2>
        <div style={{ flex: 1 }} />
        <Button title={t("rotas.nova.dica")} onClick={novaRota} disabled={loading}>
          {t("rotas.nova")}
        </Button>
      </div>

      <Banner kind="error">{error}</Banner>

      {!loading && rotas.length === 0 && (
        <p className="muted">{t("rotas.vazio")}</p>
      )}

      {rotas.map((r) => (
        <div key={r.id} className="card">
          <div className="row">
            <div>
              <span className="badge">{statusLabel(r.status)}</span>{" "}
              <span className="muted">
                {t("rotas.criadaEm")}{" "}
                {new Date(r.dataCriacao).toLocaleDateString("pt-BR")}
              </span>
            </div>
            <div style={{ flex: 1 }} />
            <Button
              title={t("rotas.abrir.dica")}
              variant="secondary"
              onClick={() => nav(`/rotas/${r.id}`)}
            >
              Abrir
            </Button>
            <Button
              title={t("rotas.excluir.dica")}
              variant="danger"
              onClick={() => excluirRota(r.id)}
            >
              {t("acao.excluir")}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

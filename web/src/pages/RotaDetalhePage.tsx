import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { RotaDetalhe, Parada, Prioridade } from "../api/types";
import { Field, Button, Banner, Card, useAsync } from "../components/ui";
import { t } from "../i18n";

// ────────────────────────────────────────────────────────
// Formulário de adição de parada
// ────────────────────────────────────────────────────────
interface FormParada {
  enderecoTexto: string;
  janelaHorarioInicio: string;
  janelaHorarioFim: string;
  prioridade: Prioridade | "";
  descricaoPacote: string;
}

const FORM_VAZIO: FormParada = {
  enderecoTexto: "",
  janelaHorarioInicio: "",
  janelaHorarioFim: "",
  prioridade: "",
  descricaoPacote: "",
};

function validarForm(f: FormParada): string | null {
  if (!f.enderecoTexto.trim()) return t("erro.enderecoObrigatorio");
  const temInicio = f.janelaHorarioInicio !== "";
  const temFim = f.janelaHorarioFim !== "";
  if (temInicio !== temFim) return t("erro.janelaIncompleta");
  if (temInicio && temFim && f.janelaHorarioInicio >= f.janelaHorarioFim)
    return t("erro.janelaInvertida");
  return null;
}

function AdicionarParada({ idRota, onAdicionada }: { idRota: string; onAdicionada: (p: Parada) => void }) {
  const [form, setForm] = useState<FormParada>(FORM_VAZIO);
  const { loading, error, setError, run } = useAsync();

  function campo<K extends keyof FormParada>(k: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }));
  }

  function submeter(e: React.FormEvent) {
    e.preventDefault();
    const err = validarForm(form);
    if (err) { setError(err); return; }

    run(async () => {
      const payload: Record<string, unknown> = { enderecoTexto: form.enderecoTexto.trim() };
      if (form.janelaHorarioInicio) payload.janelaHorarioInicio = form.janelaHorarioInicio;
      if (form.janelaHorarioFim) payload.janelaHorarioFim = form.janelaHorarioFim;
      if (form.prioridade) payload.prioridade = form.prioridade;
      if (form.descricaoPacote.trim()) payload.descricaoPacote = form.descricaoPacote.trim();

      const p = await api.post<Parada>(`/rotas/${idRota}/paradas`, payload);
      onAdicionada(p);
      setForm(FORM_VAZIO);
    });
  }

  return (
    <Card title={t("parada.adicionar.titulo")}>
      <Banner kind="error">{error}</Banner>
      <form onSubmit={submeter} noValidate>
        <Field
          label={t("parada.endereco")}
          title={t("parada.endereco.dica")}
          type="text"
          value={form.enderecoTexto}
          onChange={campo("enderecoTexto")}
          placeholder={t("parada.endereco.placeholder")}
          required
        />

        <fieldset>
          <legend title={t("parada.janela.legenda.dica")}>{t("parada.janela.legenda")}</legend>
          <div className="row">
            <Field
              label={t("parada.janela.inicio")}
              title={t("parada.janela.inicio.dica")}
              type="time"
              value={form.janelaHorarioInicio}
              onChange={campo("janelaHorarioInicio")}
            />
            <Field
              label={t("parada.janela.fim")}
              title={t("parada.janela.fim.dica")}
              type="time"
              value={form.janelaHorarioFim}
              onChange={campo("janelaHorarioFim")}
            />
          </div>
        </fieldset>

        <div className="campo">
          <label title={t("parada.prioridade.dica")}>{t("parada.prioridade")}</label>
          <select
            title={t("parada.prioridade.dica")}
            value={form.prioridade}
            onChange={campo("prioridade")}
          >
            <option value="">{t("parada.prioridade.nenhuma")}</option>
            <option value="baixa">{t("parada.prioridade.baixa")}</option>
            <option value="media">{t("parada.prioridade.media")}</option>
            <option value="alta">{t("parada.prioridade.alta")}</option>
          </select>
        </div>

        <div className="campo">
          <label title={t("parada.pacote.dica")}>{t("parada.pacote")}</label>
          <textarea
            title={t("parada.pacote.dica")}
            value={form.descricaoPacote}
            onChange={campo("descricaoPacote")}
            placeholder={t("parada.pacote.placeholder")}
            rows={2}
          />
        </div>

        <Button
          title={t("parada.adicionar.dica")}
          type="submit"
          disabled={loading}
        >
          {loading ? t("estado.carregando") : t("acao.adicionar")}
        </Button>
      </form>
    </Card>
  );
}

// ────────────────────────────────────────────────────────
// Linha de parada na tabela
// ────────────────────────────────────────────────────────
function LinhaParada({ p, onExcluir }: { p: Parada; onExcluir: (id: string) => void }) {
  const semGeo = !p.latitude || !p.longitude;
  return (
    <tr>
      <td>{p.ordemOriginal}</td>
      <td>
        {p.enderecoTexto}
        {semGeo && (
          <span className="muted" style={{ marginLeft: 6 }}>
            ({t("parada.semCoordenada")})
          </span>
        )}
      </td>
      <td>
        {p.janelaHorarioInicio && p.janelaHorarioFim
          ? `${p.janelaHorarioInicio} – ${p.janelaHorarioFim}`
          : "—"}
      </td>
      <td>
        {p.prioridade
          ? t(`parada.prioridade.${p.prioridade}` as Parameters<typeof t>[0])
          : "—"}
      </td>
      <td>
        <span className="badge">{t(`parada.origem.${p.origemEntrada}` as Parameters<typeof t>[0])}</span>
      </td>
      <td>
        <Button
          title={t("parada.excluir.dica")}
          variant="danger"
          onClick={() => onExcluir(p.id)}
        >
          {t("acao.excluir")}
        </Button>
      </td>
    </tr>
  );
}

// ────────────────────────────────────────────────────────
// Página principal
// ────────────────────────────────────────────────────────
export function RotaDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [rota, setRota] = useState<RotaDetalhe | null>(null);
  const { loading, error, run } = useAsync();

  useEffect(() => {
    if (!id) return;
    run(async () => {
      const r = await api.get<RotaDetalhe>(`/rotas/${id}`);
      setRota(r);
    });
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  function onAdicionada(p: Parada) {
    setRota((prev) => prev ? { ...prev, paradas: [...prev.paradas, p] } : prev);
  }

  async function excluirParada(pid: string) {
    if (!id) return;
    run(async () => {
      await api.del(`/rotas/${id}/paradas/${pid}`);
      setRota((prev) =>
        prev ? { ...prev, paradas: prev.paradas.filter((p) => p.id !== pid) } : prev
      );
    });
  }

  if (loading && !rota) return <div className="content"><p>{t("estado.carregando")}</p></div>;

  return (
    <div className="content">
      <div className="row" style={{ marginBottom: 16 }}>
        <Button title="Voltar para lista de rotas" variant="secondary" onClick={() => nav("/rotas")}>
          ← {t("rotas.titulo")}
        </Button>
      </div>

      <Banner kind="error">{error}</Banner>

      {rota && (
        <>
          <h2 style={{ marginTop: 0 }}>
            {t("paradas.titulo")}{" "}
            <span className="muted" style={{ fontSize: 14 }}>
              #{rota.id.slice(0, 8)}
            </span>
          </h2>
          <p className="muted">{t("paradas.explicacao")}</p>

          {rota.paradas.length === 0 ? (
            <p className="muted">{t("paradas.vazio")}</p>
          ) : (
            <div className="card" style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t("parada.endereco")}</th>
                    <th>{t("parada.janela.legenda")}</th>
                    <th>{t("parada.prioridade")}</th>
                    <th>Origem</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rota.paradas.map((p) => (
                    <LinhaParada key={p.id} p={p} onExcluir={excluirParada} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <AdicionarParada idRota={rota.id} onAdicionada={onAdicionada} />
        </>
      )}
    </div>
  );
}

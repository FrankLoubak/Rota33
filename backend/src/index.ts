/**
 * Finalidade: ponto de entrada da API REST do Rota33 (esqueleto Sprint 0).
 * Como funciona: sobe um servidor Express com healthcheck; rotas de negócio (auth, rotas,
 *   paradas, otimização, créditos) entram a partir do Sprint 2 sobre esta app.
 * Relações: futuro consumidor de db/ (Postgres/PostGIS) e das interfaces em src/providers/.
 */
import express from "express";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "rota33-backend" });
});

const port = Number(process.env.PORT ?? 3100);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`rota33-backend ouvindo na porta ${port}`);
});

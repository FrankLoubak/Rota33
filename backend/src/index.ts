/**
 * Finalidade: ponto de entrada da API REST do Rota33.
 * Como funciona: cria a app (app.ts) e escuta na porta configurada.
 * Relações: usa createApp (auth + healthcheck). Rotas de negócio a partir do Sprint 3.
 */
import { createApp } from "./app";

const app = createApp();
const port = Number(process.env.PORT ?? 3100);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`rota33-backend ouvindo na porta ${port}`);
});

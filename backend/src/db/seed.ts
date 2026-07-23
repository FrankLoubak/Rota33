/**
 * Finalidade: seed mínimo (1 usuário + carteira + assinatura gratuita) para dev/testes.
 * Como funciona: conecta via DATABASE_URL e insere os registros base.
 * Relações: usa schema/index e client. Rodar via `npm run db:seed`.
 */
import { db, pool } from "./client";
import { assinaturas, carteirasCreditos, usuarios } from "./schema/index";

async function main() {
  const [u] = await db
    .insert(usuarios)
    .values({ nome: "Motorista Demo", email: "demo@rota33.local", provedorLogin: "email" })
    .onConflictDoNothing()
    .returning();

  if (u) {
    await db.insert(carteirasCreditos).values({ idUsuario: u.id, saldoAtual: 10 }).onConflictDoNothing();
    await db
      .insert(assinaturas)
      .values({ idUsuario: u.id, tier: "gratuito", limiteCreditosPeriodo: 100 })
      .onConflictDoNothing();
  }

  await pool.end();
  // eslint-disable-next-line no-console
  console.log(`seed ok — usuario=${u?.id ?? "(já existente)"}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("falha no seed:", err);
  process.exit(1);
});

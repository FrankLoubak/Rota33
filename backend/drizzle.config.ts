/**
 * Finalidade: configuração do Drizzle Kit (geração/aplicação de migrations) do Rota33.
 * Como funciona: aponta para o schema em src/db/schema e para o Postgres/PostGIS via env.
 * Relações: usado por db:generate/db:migrate; schema populado no Sprint 1. ORM = Drizzle (D7).
 */
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://rota33:rota33_dev@localhost:5442/rota33_dev",
  },
} satisfies Config;

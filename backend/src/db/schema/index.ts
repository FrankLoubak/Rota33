/**
 * Finalidade: ponto único de re-export do schema (enums + tabelas).
 * Relações: consumido por drizzle.config, client, migrate, seed e serviços.
 */
export * from "./enums";
export * from "./tables";

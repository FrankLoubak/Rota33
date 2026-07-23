/**
 * Finalidade: configuração de auth/segurança lida de variáveis de ambiente.
 * Como funciona: expõe `config` com defaults de dev; em produção exige os segredos.
 * Relações: consumido por auth/*, providers (email/social) e rate limiting. Sessão = D8.
 */
const isProd = process.env.NODE_ENV === "production";

function required(name: string, devFallback: string): string {
  const v = process.env[name];
  if (v && v.length > 0) return v;
  if (isProd) throw new Error(`variável obrigatória ausente: ${name}`);
  return devFallback;
}
const num = (name: string, def: number): number => (process.env[name] ? Number(process.env[name]) : def);

export const config = {
  isProd,
  appBaseUrl: process.env.APP_BASE_URL ?? "http://localhost:5173",
  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET", "dev-access-secret-trocar"),
    accessTtlSeconds: num("ACCESS_TOKEN_TTL_SECONDS", 15 * 60),
    refreshTtlSeconds: num("REFRESH_TOKEN_TTL_SECONDS", 7 * 24 * 3600),
  },
  tokenPepper: required("TOKEN_PEPPER", "dev-token-pepper-trocar"),
  email: {
    verifyTtlSeconds: num("EMAIL_VERIFY_TTL_SECONDS", 24 * 3600),
    resetTtlSeconds: num("PASSWORD_RESET_TTL_SECONDS", 3600),
  },
  rateLimit: {
    loginWindowMs: num("RL_LOGIN_WINDOW_MS", 15 * 60 * 1000),
    loginMax: num("RL_LOGIN_MAX", 20),
    globalMax: num("RL_GLOBAL_MAX", 1000),
  },
  emailProvider: process.env.EMAIL_PROVIDER ?? "log", // D10
  geocodingProvider: process.env.GEOCODING_PROVIDER ?? "mock", // D4 (mock | nominatim | google)
  nominatimUrl: process.env.NOMINATIM_URL ?? "https://nominatim.openstreetmap.org",
};

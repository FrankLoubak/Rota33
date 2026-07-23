/**
 * Finalidade: interface SocialAuthVerifier (D9) + adapter mock + factory.
 * Como funciona: verifica um ID token de Google/Apple e devolve o e-mail (e nome) do
 *   usuário. O adapter `mock` aceita tokens no formato "mock:<email>:<nome>" para testes;
 *   os adapters reais (Google/Apple) ficam plugáveis por env quando houver client IDs.
 * Relações: usado pelo authService no login social.
 */
export type ProvedorSocial = "google" | "apple";

export interface PerfilSocial {
  email: string;
  nome?: string;
}

export interface SocialAuthVerifier {
  verify(provedor: ProvedorSocial, idToken: string): Promise<PerfilSocial | null>;
}

class MockSocialVerifier implements SocialAuthVerifier {
  async verify(_provedor: ProvedorSocial, idToken: string): Promise<PerfilSocial | null> {
    // Formato de teste: "mock:<email>:<nome opcional>"
    const m = /^mock:([^:]+)(?::(.+))?$/.exec(idToken);
    if (!m) return null;
    return { email: m[1], nome: m[2] };
  }
}

// TODO: GoogleVerifier/AppleVerifier reais (google-auth-library / apple-signin) por env.
let instance: SocialAuthVerifier | undefined;
export function getSocialVerifier(): SocialAuthVerifier {
  if (!instance) instance = new MockSocialVerifier();
  return instance;
}

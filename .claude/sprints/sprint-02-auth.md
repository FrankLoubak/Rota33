# Sprint 2 — Autenticação + sessão · modelo líder: Opus 4.8 (cybersecurity)

## Escopo
E-mail/senha + **Google Sign-In** e **Apple Sign-In**; gestão de sessão/token; base de
conformidade LGPD/GDPR.

## Definition of Done
- [ ] Cadastro/login e-mail+senha (hash forte) e login social (Google, Apple).
- [ ] Sessão/token (JWT ou sessão — documentar a escolha) com expiração/refresh.
- [ ] Verificação de e-mail e reset de senha.
- [ ] **Exclusão/anonimização de conta** (direito do titular, G7).
- [ ] Rate limiting no login.
- [ ] `tests-agent`: PASS (fluxos de auth + social mock).

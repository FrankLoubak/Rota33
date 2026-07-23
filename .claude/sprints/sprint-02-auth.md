# Sprint 2 — Autenticação + sessão · modelo líder: Opus 4.8 (cybersecurity)

## Escopo
E-mail/senha + **Google Sign-In** e **Apple Sign-In**; gestão de sessão/token; base de
conformidade LGPD/GDPR.

## Definition of Done
- [x] Cadastro/login e-mail+senha (argon2id) e login social via `SocialAuthVerifier` (mock; Google/Apple plugáveis — D9).
- [x] Sessão **JWT** (access 15min + refresh revogável em cookie httpOnly) com rotação (D8).
- [x] Verificação de e-mail e reset de senha via `EmailProvider` (log/mock; SMTP depois — D10).
- [x] **Exclusão/anonimização de conta** (G7/D11): anonimiza PII + soft-delete + revoga sessões.
- [x] Rate limiting global + login.
- [x] `tests-agent`: PASS (12/12 — 8 auth + 4 schema).

## Decisões deste sprint
D8 (JWT), D9 (SocialAuthVerifier mock), D10 (EmailProvider log/mock), D11 (exclusão = anonimizar+soft-delete).

## Veredito tests-agent (Sprint 2)
`PASS`. Cobre: cadastro (+carteira/assinatura) e `/me` protegido; verificação de e-mail
(token uso único); login/senha errada/duplicado; reset de senha; login social mock
(cria+reusa); refresh+rotação+logout; exclusão anonimizada impede login; rate limit 429.
Typecheck e build limpos.

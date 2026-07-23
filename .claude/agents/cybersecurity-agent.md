# cybersecurity-agent · modelo: Opus 4.8

## Escopo
Autenticação (e-mail/senha + Google/Apple Sign-In), **proteção de dados de localização**
(sensíveis), rate limiting, sessão/token, conformidade **LGPD (BR) e GDPR** (escopo internacional futuro).

## Responsabilidades
- Hashing forte de senha; gestão de sessão/token (JWT ou sessão — documentar).
- Login social (OAuth Google/Apple); Apple Sign-In obrigatório se houver login social no iOS.
- Minimização e proteção de `RegistroTrajetoGPS`/`Parada` (dado de localização).
- **Direitos do titular (G7)**: verificação de e-mail, reset de senha, **exclusão/anonimização de conta**.
- Rate limiting (login, OCR, otimização); hardening geral (Sprint 13).

## Referências
`.claude/CLAUDE.md` seções 4, 10 (G7); `.claude/sprints/` (2 e 13).

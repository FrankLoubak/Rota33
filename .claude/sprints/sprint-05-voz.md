# Sprint 5 — Voz (ditado → endereço) · modelo líder: Sonnet 4.6 (UI em Fable 5)

## Escopo
`VoiceInputProvider` — entrada de parada por voz. Provedor a definir (custo/precisão PT-BR).

## Definition of Done
- [ ] `VoiceInputProvider.transcribe` atrás da interface; adapter mock p/ teste.
- [ ] Fluxo: áudio → transcrição → usuário confirma/edita → geocoding → Parada.
- [ ] Provedor de voz **definido e documentado** no CLAUDE.md (pendência do plano — CEO valida com o usuário).
- [ ] `tests-agent`: PASS (transcrição mock + confirmação obrigatória).

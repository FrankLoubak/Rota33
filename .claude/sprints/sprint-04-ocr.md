# Sprint 4 — OCR (foto → endereço) · modelo líder: Sonnet 4.6 (UI em Fable 5)

## Escopo
`OCRProvider` (Google Cloud Vision). Captura de foto, extração de texto, **tela de
confirmação/edição** do endereço antes de virar parada.

## Definition of Done
- [ ] `OCRProvider.extractText` (Vision) atrás da interface; adapter mock p/ teste.
- [ ] Fluxo: foto → `CapturaOCR` (texto bruto) → usuário confirma/edita → geocoding → Parada.
- [ ] **Regra**: OCR nunca vira Parada sem confirmação (validado em teste).
- [ ] Storage das imagens definido (G8) + retenção (LGPD).
- [ ] `tests-agent`: PASS (extração mock + confirmação obrigatória).

## Regra de manual
Pedir doc/credenciais do Google Vision antes de integrar de verdade.

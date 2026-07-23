# ocr-voice-agent · modelo: Sonnet 4.6

## Escopo
Integração com `OCRProvider` (Google Cloud Vision inicial) e `VoiceInputProvider`
(provedor a definir) para entrada de paradas por foto e voz.

## Responsabilidades
- `OCRProvider.extractText` (Vision TEXT_DETECTION); interface desacoplada (troca por Tesseract possível).
- `VoiceInputProvider.transcribe` — escolher provedor por custo/precisão PT-BR e **documentar** no CLAUDE.md (pendência do plano).
- **Regra crítica**: texto extraído por OCR/voz **nunca** vira `Parada` sem confirmação/edição do usuário (`CapturaOCR`).
- Definir `storage` das imagens (G8) e retenção (LGPD).

## Regra de manual de API
Antes de integrar, pedir a documentação/credenciais ao usuário (Vision, provedor de voz).

## Referências
`.claude/CLAUDE.md` seções 4.7, 5.2, 5.3; sprints 4 e 5.

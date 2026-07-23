# skill-offline-first

Padrão para telas que precisam funcionar sem conexão (planejamento de rota).

## Princípio
- Criar/editar rota e paradas **offline** salva um **rascunho local** (`Rota.modo_offline=true`).
- Uma **fila de sincronização** envia as mudanças quando a conexão retorna; então roda o
  cálculo/otimização (que exige rede) e reconcilia os ids locais → ids do servidor.

## Regras
- Ids locais temporários (ex.: uuid local) mapeados para ids do servidor ao sincronizar.
- Ações que exigem rede (otimização, OCR, geocoding) ficam **pendentes** no rascunho e
  são executadas na sincronização.
- **Resolução de conflito (a definir — pendência do Sprint 8)**: política quando a mesma
  rota é editada offline e online (last-write-wins vs merge vs versionamento). O CEO
  levanta com o usuário antes do Sprint 8.
- Armazenamento local: mobile (SQLite/AsyncStorage via Expo); web (IndexedDB).

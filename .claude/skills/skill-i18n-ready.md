# skill-i18n-ready

Toda string de interface e todo parser de endereço devem ser **desacoplados do idioma/país**
desde o Sprint 1 — mesmo com conteúdo inicial só em PT-BR — para permitir expansão
internacional sem retrabalho estrutural.

## Regras
- **Nenhuma string de UI hardcoded** no meio do componente: usar um catálogo de traduções
  (ex.: i18next / expo-localization) com chaves; o PT-BR é o primeiro locale.
- **Endereços/geocoding**: não assumir formato brasileiro fixo — o parser/normalizador de
  endereço deve receber o `pais`/`locale` do usuário e ser substituível por país.
- **Formatos**: datas, números, moeda e horário via API de formatação sensível a locale.
- `Usuario.idioma_preferido` e `Usuario.pais` definem o locale efetivo.
- Coordenadas e cálculo de rota são independentes de idioma (só a apresentação muda).

## Objetivo
Lançar em PT-BR agora; adicionar idioma/país depois trocando catálogo + config de locale,
sem mexer na lógica dos componentes.

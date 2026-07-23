/**
 * Finalidade: i18n do frontend web (skill-i18n-ready) — catálogo de strings por chave.
 * Como funciona: nenhuma string de UI é hardcoded nos componentes; tudo passa por t(chave).
 *   O locale inicial é pt-BR; para expandir, basta adicionar outro catálogo e trocar o
 *   locale ativo (Usuario.idioma_preferido) sem tocar nos componentes.
 * Relações: consumido por todas as páginas/componentes.
 */
export type Locale = "pt-BR";

const ptBR = {
  // Comuns
  "app.nome": "Rota33",
  "acao.salvar": "Salvar",
  "acao.cancelar": "Cancelar",
  "acao.excluir": "Excluir",
  "acao.entrar": "Entrar",
  "acao.cadastrar": "Cadastrar",
  "acao.sair": "Sair",
  "acao.adicionar": "Adicionar",
  "estado.carregando": "carregando…",

  // Login/Cadastro
  "login.titulo": "Entrar no Rota33",
  "login.cadastro.titulo": "Criar conta",
  "login.nome": "Nome",
  "login.nome.dica": "Seu nome completo",
  "login.email": "E-mail",
  "login.email.dica": "E-mail usado para entrar na sua conta",
  "login.senha": "Senha",
  "login.senha.dica": "Sua senha (mínimo de 8 caracteres)",
  "login.social.google": "Entrar com Google",
  "login.social.google.dica": "Entrar usando sua conta Google",
  "login.social.apple": "Entrar com Apple",
  "login.social.apple.dica": "Entrar usando sua conta Apple",
  "login.alternar.paraCadastro": "Não tem conta? Cadastre-se",
  "login.alternar.paraLogin": "Já tem conta? Entrar",
  "login.entrar.dica": "Entrar com e-mail e senha",
  "login.cadastrar.dica": "Criar sua conta com e-mail e senha",

  // Rotas
  "rotas.titulo": "Minhas rotas",
  "rotas.nova": "Nova rota",
  "rotas.nova.dica": "Criar uma nova rota de entregas",
  "rotas.vazio": "Nenhuma rota ainda. Crie a primeira!",
  "rotas.abrir.dica": "Abrir esta rota para adicionar e ver paradas",
  "rotas.excluir.dica": "Excluir esta rota e todas as suas paradas",
  "rotas.status.planejamento": "Planejamento",
  "rotas.status.em_andamento": "Em andamento",
  "rotas.status.concluida": "Concluída",
  "rotas.status.cancelada": "Cancelada",
  "rotas.criadaEm": "Criada em",

  // Paradas
  "paradas.titulo": "Paradas",
  "paradas.explicacao": "Adicione os pontos de entrega — o Rota33 define a melhor ordem de visita automaticamente.",
  "paradas.vazio": "Nenhuma parada ainda. Adicione os pontos de entrega.",
  "parada.adicionar.titulo": "Adicionar parada",
  "parada.endereco": "Endereço",
  "parada.endereco.dica": "Endereço completo do ponto de entrega (rua, número, bairro, cidade)",
  "parada.endereco.placeholder": "Ex.: Av. Paulista, 1000 — São Paulo",
  "parada.janela.legenda": "Janela de horário (opcional)",
  "parada.janela.legenda.dica": "Faixa de horário em que a entrega pode ser feita",
  "parada.janela.inicio": "Início",
  "parada.janela.inicio.dica": "Horário mais cedo para a entrega",
  "parada.janela.fim": "Fim",
  "parada.janela.fim.dica": "Horário mais tarde para a entrega",
  "parada.prioridade": "Prioridade",
  "parada.prioridade.dica": "Urgência da entrega — o otimizador prioriza as mais altas",
  "parada.prioridade.nenhuma": "— sem prioridade —",
  "parada.prioridade.baixa": "Baixa",
  "parada.prioridade.media": "Média",
  "parada.prioridade.alta": "Alta",
  "parada.pacote": "Descrição do pacote (opcional)",
  "parada.pacote.dica": "Informações do pacote: tamanho, fragilidade, instruções",
  "parada.pacote.placeholder": "Ex.: caixa média, frágil",
  "parada.adicionar.dica": "Adicionar este ponto de entrega à rota",
  "parada.editar.dica": "Editar esta parada",
  "parada.excluir.dica": "Remover esta parada da rota",
  "parada.semCoordenada": "endereço não localizado",
  "parada.origem.manual": "manual",
  "parada.origem.foto": "foto",
  "parada.origem.voz": "voz",

  // Erros/validação
  "erro.enderecoObrigatorio": "Informe o endereço da parada.",
  "erro.janelaIncompleta": "Preencha início e fim da janela (ou deixe ambos em branco).",
  "erro.janelaInvertida": "O início da janela deve ser anterior ao fim.",
  "erro.inesperado": "Algo deu errado. Tente novamente.",
} as const;

export type MsgKey = keyof typeof ptBR;

const catalogos: Record<Locale, Record<MsgKey, string>> = { "pt-BR": ptBR };
let localeAtivo: Locale = "pt-BR";

export function setLocale(l: Locale): void {
  localeAtivo = l;
}

export function t(key: MsgKey): string {
  return catalogos[localeAtivo][key] ?? key;
}
